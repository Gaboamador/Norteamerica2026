import { db } from "@/services/firebase/firebase";
import {
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  query,
  serverTimestamp,
  setDoc,
  where,
  writeBatch,
} from "firebase/firestore";

const LOCKED_PREDICTIONS_META_REF = doc(db, "meta", "lockedPredictions");

function toMillis(value) {
  if (typeof value === "number") return value;

  if (typeof value?.toMillis === "function") {
    return value.toMillis();
  }

  if (value?.seconds !== undefined) {
    return value.seconds * 1000 + Math.floor((value.nanoseconds || 0) / 1000000);
  }

  const parsed = new Date(value).getTime();

  return Number.isFinite(parsed) ? parsed : null;
}

function isValidPrediction(prediction) {
  return (
    prediction &&
    typeof prediction.uid === "string" &&
    typeof prediction.matchId === "string" &&
    Number.isInteger(prediction.predHome) &&
    Number.isInteger(prediction.predAway) &&
    prediction.predHome >= 0 &&
    prediction.predAway >= 0 &&
    prediction.predHome <= 20 &&
    prediction.predAway <= 20
  );
}

function isLockedMatch(match, nowMillis) {
  const lockTimeMillis = toMillis(match?.lockTime);

  return (
    typeof match?.id === "string" &&
    Number.isFinite(lockTimeMillis) &&
    lockTimeMillis <= nowMillis
  );
}

function getMatchPayload(match, predictionsByUid) {
  return {
    h: match.homeTeam || "",
    a: match.awayTeam || "",
    r: match.round ?? "",
    g: match.group || "",
    s: toMillis(match.startTime) || null,
    l: toMillis(match.lockTime) || null,
    p: predictionsByUid,
  };
}

function buildUsersMap(usersDocs, predictions) {
  const usersByUid = {};

  usersDocs.forEach((document) => {
    const data = document.data();

    usersByUid[document.id] = {
      n: data.displayName || data.username || document.id,
    };
  });

  predictions.forEach((prediction) => {
    if (!prediction?.uid || usersByUid[prediction.uid]) return;

    usersByUid[prediction.uid] = {
      n: prediction.displayName || prediction.uid,
    };
  });

  return usersByUid;
}

function pickGroupUsers(group, usersByUid) {
  const members = Array.isArray(group.members) ? group.members : [];

  return members.reduce((acc, uid) => {
    acc[uid] = usersByUid[uid] || { n: uid };
    return acc;
  }, {});
}

async function getPublishedMatchIds() {
  const snap = await getDoc(LOCKED_PREDICTIONS_META_REF);

  if (!snap.exists()) return new Set();

  const data = snap.data();
  const publishedMatchIds = Array.isArray(data.publishedMatchIds)
    ? data.publishedMatchIds
    : [];

  return new Set(publishedMatchIds);
}

async function getPredictionsByMatchId(matchId) {
  const predictionsQuery = query(
    collection(db, "predictions"),
    where("matchId", "==", matchId)
  );

  const snap = await getDocs(predictionsQuery);

  return snap.docs
    .map((document) => ({
      id: document.id,
      ...document.data(),
    }))
    .filter(isValidPrediction);
}

/**
 * Publica snapshots compactos de pronósticos bloqueados por grupo.
 *
 * Es incremental:
 * - sólo procesa partidos cuyo lockTime ya pasó;
 * - sólo procesa partidos que todavía no figuran en meta/lockedPredictions;
 * - actualiza groups/{groupId}/lockedPredictions/summary.
 *
 * No usa listeners.
 * No recalcula standings.
 * No modifica predicciones originales.
 */
export async function publishLockedPredictions() {
  const nowMillis = Date.now();

  const [matchesSnap, groupsSnap, usersSnap, publishedMatchIds] =
    await Promise.all([
      getDocs(collection(db, "matches")),
      getDocs(collection(db, "groups")),
      getDocs(collection(db, "users")),
      getPublishedMatchIds(),
    ]);

  const lockedMatchesToPublish = matchesSnap.docs
    .map((document) => ({
      id: document.id,
      ...document.data(),
    }))
    .filter((match) => isLockedMatch(match, nowMillis))
    .filter((match) => !publishedMatchIds.has(match.id))
    .sort((a, b) => {
      const aStart = toMillis(a.startTime) || 0;
      const bStart = toMillis(b.startTime) || 0;

      return aStart - bStart;
    });

  if (lockedMatchesToPublish.length === 0) {
    return {
      ok: true,
      newMatchCount: 0,
      groupCount: groupsSnap.size,
      predictionCount: 0,
      publishedMatchIds: [],
    };
  }

  const groups = groupsSnap.docs.map((document) => ({
    id: document.id,
    ...document.data(),
  }));

  const predictionsByMatchId = {};
  const allNewPredictions = [];

  for (const match of lockedMatchesToPublish) {
    const predictions = await getPredictionsByMatchId(match.id);

    predictionsByMatchId[match.id] = predictions;
    allNewPredictions.push(...predictions);
  }

  const usersByUid = buildUsersMap(usersSnap.docs, allNewPredictions);

  const batch = writeBatch(db);
  const newMatchIds = lockedMatchesToPublish.map((match) => match.id);

  groups.forEach((group) => {
    const members = Array.isArray(group.members) ? group.members : [];
    const memberSet = new Set(members);

    const matchesPayload = {};

    lockedMatchesToPublish.forEach((match) => {
      const predictionsForMatch = predictionsByMatchId[match.id] || [];

      const predictionsByUid = predictionsForMatch.reduce((acc, prediction) => {
        if (!memberSet.has(prediction.uid)) return acc;

        acc[prediction.uid] = [
          prediction.predHome,
          prediction.predAway,
        ];

        return acc;
      }, {});

      matchesPayload[match.id] = getMatchPayload(match, predictionsByUid);
    });

    const groupSummaryRef = doc(
      db,
      "groups",
      group.id,
      "lockedPredictions",
      "summary"
    );

    batch.set(
      groupSummaryRef,
      {
        groupId: group.id,
        groupName: group.name || "",
        version: increment(1),
        updatedAt: serverTimestamp(),
        updatedAtMillis: nowMillis,
        lockedMatchIds: arrayUnion(...newMatchIds),
        users: pickGroupUsers(group, usersByUid),
        matches: matchesPayload,
      },
      { merge: true }
    );
  });

  batch.set(
    LOCKED_PREDICTIONS_META_REF,
    {
      version: increment(1),
      updatedAt: serverTimestamp(),
      updatedAtMillis: nowMillis,
      publishedMatchIds: arrayUnion(...newMatchIds),
      lastPublishedMatchIds: newMatchIds,
      lastPublishedMatchCount: newMatchIds.length,
    },
    { merge: true }
  );

  await batch.commit();

  return {
    ok: true,
    newMatchCount: lockedMatchesToPublish.length,
    groupCount: groups.length,
    predictionCount: allNewPredictions.length,
    publishedMatchIds: newMatchIds,
  };
}

export async function publishLockedPredictionsSafely(context = "locked predictions") {
  try {
    return await publishLockedPredictions();
  } catch (error) {
    console.error(`Error publicando pronósticos bloqueados (${context})`, error);
    return null;
  }
}