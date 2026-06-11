import { db } from "./firebase";
import {
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";

const MATCHES_META_REF = doc(db, "meta", "matchesMeta");

export function buildMatchesSig({ finishedCount, lastResultAtMillis }) {
  return `${finishedCount}:${lastResultAtMillis || 0}`;
}

/**
 * Recalcula y guarda la metadata liviana de resultados.
 *
 * Se usa cuando cambia el universo de partidos finished:
 * - se carga un resultado
 * - se resetea un partido
 * - se corrige un resultado
 *
 * Esta función puede tirar error. Usar refreshMatchesMetaSafely()
 * cuando el refresh de cache no deba bloquear el flujo principal.
 */
export async function refreshMatchesMeta() {
  const finishedQuery = query(
    collection(db, "matches"),
    where("status", "==", "finished")
  );

  const finishedSnap = await getDocs(finishedQuery);

  const finishedCount = finishedSnap.size;
  const lastResultAtMillis = Date.now();

  const sig = buildMatchesSig({
    finishedCount,
    lastResultAtMillis,
  });

  const payload = {
    finishedCount,
    lastResultAt: serverTimestamp(),
    lastResultAtMillis,
    sig,
    updatedAt: serverTimestamp(),
  };

  await setDoc(MATCHES_META_REF, payload, { merge: true });

  return payload;
}

/**
 * Versión best-effort para que el cache de partidos nunca bloquee:
 * - carga de resultado oficial
 * - reset de resultado
 * - recompute de standings
 */
export async function refreshMatchesMetaSafely(context = "matches meta") {
  try {
    return await refreshMatchesMeta();
  } catch (error) {
    console.error(`Error actualizando meta/matchesMeta (${context})`, error);
    return null;
  }
}