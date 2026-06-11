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