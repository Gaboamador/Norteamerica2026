import { db } from "./firebase";
import {
  doc,
  setDoc,
  getDoc,
  getDocs,
  collection,
  collectionGroup,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";

/**
 * ===============================
 * MATCHES
 * ===============================
 */

/**
 * Obtener todos los partidos
 */
export const getAllMatches = async () => {
  const snap = await getDocs(collection(db, "matches"));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

/**
 * Obtener un partido por id
 */
export const getMatchById = async (matchId) => {
  const ref = doc(db, "matches", matchId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
};

/**
 * ===============================
 * PREDICTIONS
 * ===============================
 */

/**
 * ID único: uid_matchId
 */
const buildPredictionId = (uid, matchId) => `${uid}_${matchId}`;

/**
 * Crear o actualizar predicción
 */
export const savePrediction = async ({
  uid,
  displayName,
  matchId,
  predHome,
  predAway,
}) => {
  if (!uid) throw new Error("uid requerido");
  if (!matchId) throw new Error("matchId requerido");

  const id = buildPredictionId(uid, matchId);
  const ref = doc(db, "predictions", id);

  await setDoc(
    ref,
    {
      uid,
      displayName: displayName || null, // 👈 nuevo
      matchId,
      predHome,
      predAway,
      updatedAt: serverTimestamp(),

      // estos quedan fijos (solo se pisan si no existen)
      createdAt: serverTimestamp(),
      locked: false,
    },
    { merge: true }
  );
};

/**
 * Obtener predicción de un usuario para un partido
 */
export const getUserPredictionForMatch = async (uid, matchId) => {
  const id = buildPredictionId(uid, matchId);
  const ref = doc(db, "predictions", id);

  const snap = await getDoc(ref);
  if (!snap.exists()) return null;

  return { id: snap.id, ...snap.data() };
};

/**
 * Obtener todas las predicciones de un usuario
 */
export const getUserPredictions = async (uid) => {
  const q = query(
    collection(db, "predictions"),
    where("uid", "==", uid)
  );

  const snap = await getDocs(q);

  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

/**
 * Obtener predicciones de un partido (para scoring / debug)
 */
export const getPredictionsByMatch = async (matchId) => {
  const q = query(
    collection(db, "predictions"),
    where("matchId", "==", matchId)
  );

  const snap = await getDocs(q);

  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

/**
 * ===============================
 * STANDINGS
 * ===============================
 */

/**
 * Obtener tabla completa
 */
export const getStandings = async () => {
  const snap = await getDocs(collection(db, "standings"));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

/**
 * ===============================
 * HELPERS
 * ===============================
 */

/**
 * Crear tiempo de lockeo de un partido
 */
const buildLockTime = (date) => {
  const base =
    date?.toMillis?.()
      ? date.toMillis()
      : new Date(date).getTime();

  return new Date(base - 15 * 60 * 1000);
};

/**
 * Saber si un match está bloqueado (frontend)
 * ⚠️ esto es solo UX, la seguridad está en rules
 */
export const isMatchLocked = (match) => {
  if (!match?.lockTime) return true;

  const now = Date.now();
  // const lock = new Date(match.lockTime);

  // return now >= lock;
  const lockTime =
    match.lockTime?.toMillis?.() ??
    new Date(match.lockTime).getTime();

  return now >= lockTime;

};


/**
 * Crear partido
 */
export const createMatch = async (match) => {
  const ref = doc(collection(db, "matches"));
  await setDoc(ref, match);
  // await setDoc(ref, {
  //   ...match,
  //   lockTime: buildLockTime(match.date),
  // });
};

/**
 * Actualizar resultado de partido
 */
export const updateMatch = async (matchId, data) => {
  const ref = doc(db, "matches", matchId);
  // const updateData = { ...data };
  // if (data.date) {
  //   updateData.lockTime = buildLockTime(data.date);
  // }

  // await setDoc(ref, updateData, { merge: true });
  await setDoc(ref, data, { merge: true });
};

/**
 * Trae las predicciones de todos los usuarios
 */
export const getAllPredictions = async () => {
  const snap = await getDocs(collection(db, "predictions"));
  return snap.docs.map((doc) => doc.data());
};

export const resetMatchResult = async (matchId) => {
  const ref = doc(db, "matches", matchId);

  await setDoc(
    ref,
    {
      result: null,
      status: "scheduled",
    },
    { merge: true }
  );
};
export const resetMatch = async (matchId) => {
  await resetMatchResult(matchId);
};