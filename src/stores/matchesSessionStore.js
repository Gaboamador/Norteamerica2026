import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/services/firebase/firebase";

const STORAGE_VERSION = "v1";
const FINISHED_CACHE_KEY = `na2026:${STORAGE_VERSION}:matches:finished`;

const EMPTY_META = {
  finishedCount: 0,
  lastResultAtMillis: 0,
  sig: "0:0",
};

function isBrowser() {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

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

function timestampLike(millis) {
  if (millis === null || millis === undefined) return null;

  return {
    toMillis: () => millis,
    toDate: () => new Date(millis),
  };
}

function serializeMatch(match) {
  const {
    startTime,
    lockTime,
    finishedAt,
    resultUpdatedAt,
    ...rest
  } = match;

  return {
    ...rest,
    startTimeMillis: toMillis(startTime ?? match.startTimeMillis),
    lockTimeMillis: toMillis(lockTime ?? match.lockTimeMillis),
    finishedAtMillis: toMillis(finishedAt ?? match.finishedAtMillis),
    resultUpdatedAtMillis: toMillis(
      resultUpdatedAt ?? match.resultUpdatedAtMillis
    ),
  };
}

function deserializeMatch(match) {
  const startTimeMillis = toMillis(match.startTimeMillis ?? match.startTime);
  const lockTimeMillis = toMillis(match.lockTimeMillis ?? match.lockTime);
  const finishedAtMillis = toMillis(match.finishedAtMillis ?? match.finishedAt);
  const resultUpdatedAtMillis = toMillis(
    match.resultUpdatedAtMillis ?? match.resultUpdatedAt
  );

  return {
    ...match,
    startTimeMillis,
    lockTimeMillis,
    finishedAtMillis,
    resultUpdatedAtMillis,
    startTime: timestampLike(startTimeMillis),
    lockTime: timestampLike(lockTimeMillis),
    finishedAt: timestampLike(finishedAtMillis),
    resultUpdatedAt: timestampLike(resultUpdatedAtMillis),
  };
}

function normalizeMeta(snap) {
  if (!snap.exists()) return EMPTY_META;

  const data = snap.data();

  const finishedCount = Number(data.finishedCount || 0);
  const lastResultAtMillis =
    Number(data.lastResultAtMillis || 0) ||
    toMillis(data.lastResultAt) ||
    0;

  return {
    finishedCount,
    lastResultAtMillis,
    sig: data.sig || `${finishedCount}:${lastResultAtMillis}`,
  };
}

function readFinishedCache() {
  if (!isBrowser()) {
    return {
      ...EMPTY_META,
      cachedFinished: [],
    };
  }

  try {
    const raw = localStorage.getItem(FINISHED_CACHE_KEY);

    if (!raw) {
      return {
        ...EMPTY_META,
        cachedFinished: [],
      };
    }

    const parsed = JSON.parse(raw);

    return {
      finishedCount: Number(parsed.finishedCount || 0),
      lastResultAtMillis: Number(parsed.lastResultAtMillis || 0),
      sig: parsed.sig || "0:0",
      cachedFinished: Array.isArray(parsed.cachedFinished)
        ? parsed.cachedFinished.map(deserializeMatch)
        : [],
    };
  } catch {
    localStorage.removeItem(FINISHED_CACHE_KEY);

    return {
      ...EMPTY_META,
      cachedFinished: [],
    };
  }
}

function saveFinishedCache(meta, finishedMatches) {
  if (!isBrowser()) return;

  try {
    localStorage.setItem(
      FINISHED_CACHE_KEY,
      JSON.stringify({
        finishedCount: meta.finishedCount,
        lastResultAtMillis: meta.lastResultAtMillis,
        sig: meta.sig,
        cachedFinished: finishedMatches.map(serializeMatch),
      })
    );
  } catch {
    // No bloqueamos la app si localStorage falla.
  }
}

function isCacheValid(cache, meta) {
  return (
    cache.sig === meta.sig &&
    cache.finishedCount === meta.finishedCount
  );
}

function sortByStartTime(matches) {
  return [...matches].sort((a, b) => {
    const aTime = toMillis(a.startTime) ?? a.startTimeMillis ?? 0;
    const bTime = toMillis(b.startTime) ?? b.startTimeMillis ?? 0;

    return aTime - bTime;
  });
}

function mergeById(primaryMatches, overridingMatches) {
  const map = new Map();

  primaryMatches.forEach((match) => {
    map.set(match.id, match);
  });

  overridingMatches.forEach((match) => {
    map.set(match.id, match);
  });

  return sortByStartTime(Array.from(map.values()));
}

function mergeFinishedCache(cachedFinished, newFinished) {
  return mergeById(cachedFinished, newFinished).filter(
    (match) => match.status === "finished"
  );
}

async function getAllFinishedMatches() {
  const q = query(
    collection(db, "matches"),
    where("status", "==", "finished")
  );

  const snap = await getDocs(q);

  return snap.docs.map((document) =>
    deserializeMatch({
      id: document.id,
      ...document.data(),
    })
  );
}

async function getNewFinishedMatchesSince(lastResultAtMillis) {
  const q = query(
    collection(db, "matches"),
    where("finishedAtMillis", ">", lastResultAtMillis)
  );

  const snap = await getDocs(q);

  return snap.docs
    .map((document) =>
      deserializeMatch({
        id: document.id,
        ...document.data(),
      })
    )
    .filter((match) => match.status === "finished");
}

async function resolveFinishedMatches(meta) {
  const cache = readFinishedCache();

  if (isCacheValid(cache, meta)) {
    return cache.cachedFinished;
  }

  if (meta.finishedCount === 0) {
    saveFinishedCache(meta, []);
    return [];
  }

  const canTryIncremental =
    cache.cachedFinished.length > 0 &&
    cache.finishedCount < meta.finishedCount &&
    cache.lastResultAtMillis > 0;

  if (canTryIncremental) {
    const newFinished = await getNewFinishedMatchesSince(
      cache.lastResultAtMillis
    );

    const mergedFinished = mergeFinishedCache(
      cache.cachedFinished,
      newFinished
    );

    if (mergedFinished.length === meta.finishedCount) {
      saveFinishedCache(meta, mergedFinished);
      return mergedFinished;
    }
  }

  const allFinished = await getAllFinishedMatches();

  saveFinishedCache(meta, allFinished);

  return allFinished;
}

const initialCache = readFinishedCache();

let finishedMatches = initialCache.cachedFinished;
let nonFinishedMatches = [];

let metaReady = false;
let nonFinishedReady = false;
let metaRequestId = 0;

let unsubscribeNonFinished = null;
let unsubscribeMeta = null;

let state = {
  matches: sortByStartTime(initialCache.cachedFinished),
  loading: true,
  error: null,
  started: false,
};

const subscribers = new Set();

function notify() {
  subscribers.forEach((callback) => callback(state));
}

function setState(patch) {
  state = {
    ...state,
    ...patch,
  };

  notify();
}

function publishMatches() {
  setState({
    matches: mergeById(finishedMatches, nonFinishedMatches),
    loading: !(metaReady && nonFinishedReady),
  });
}

function closeMatchesListeners() {
  if (typeof unsubscribeNonFinished === "function") {
    unsubscribeNonFinished();
  }

  if (typeof unsubscribeMeta === "function") {
    unsubscribeMeta();
  }

  unsubscribeNonFinished = null;
  unsubscribeMeta = null;
}

export function getMatchesSessionSnapshot() {
  return state;
}

export function subscribeMatchesSession(callback) {
  subscribers.add(callback);

  return () => {
    subscribers.delete(callback);
  };
}

export function resetMatchesSession() {
  closeMatchesListeners();

  const cache = readFinishedCache();

  finishedMatches = cache.cachedFinished;
  nonFinishedMatches = [];

  metaReady = false;
  nonFinishedReady = false;
  metaRequestId += 1;

  state = {
    matches: sortByStartTime(cache.cachedFinished),
    loading: true,
    error: null,
    started: false,
  };

  notify();
}

export function startMatchesSession() {
  if (state.started && unsubscribeNonFinished && unsubscribeMeta) {
    return;
  }

  closeMatchesListeners();

  setState({
    loading: true,
    error: null,
    started: true,
  });

  const nonFinishedQuery = query(
    collection(db, "matches"),
    where("status", "==", "scheduled")
  );

  unsubscribeNonFinished = onSnapshot(
    nonFinishedQuery,
    (snapshot) => {
      nonFinishedMatches = snapshot.docs.map((document) =>
        deserializeMatch({
          id: document.id,
          ...document.data(),
        })
      );

      nonFinishedReady = true;
      publishMatches();
    },
    (error) => {
      console.error("Error escuchando partidos no finalizados", error);

      nonFinishedReady = true;

      setState({
        error,
      });

      publishMatches();
    }
  );

  unsubscribeMeta = onSnapshot(
    doc(db, "meta", "matchesMeta"),
    async (snapshot) => {
      const requestId = ++metaRequestId;
      const meta = normalizeMeta(snapshot);

      try {
        const resolvedFinishedMatches = await resolveFinishedMatches(meta);

        if (requestId !== metaRequestId) return;

        finishedMatches = resolvedFinishedMatches;
        metaReady = true;
        publishMatches();
      } catch (error) {
        console.error("Error resolviendo cache de partidos finished", error);

        if (requestId !== metaRequestId) return;

        metaReady = true;

        setState({
          error,
        });

        publishMatches();
      }
    },
    (error) => {
      console.error("Error leyendo meta/matchesMeta", error);

      metaReady = true;

      setState({
        error,
      });

      publishMatches();
    }
  );
}