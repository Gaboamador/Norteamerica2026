import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

/**
 * ===============================
 * GLOBAL
 * ===============================
 */
export const saveGlobalStandings = async (rows) => {
  const ref = doc(db, "standings", "global");

  await setDoc(
    ref,
    {
      key: "global",
      label: "Tabla general",
      updatedAt: serverTimestamp(),
      rows,
    },
    { merge: true }
  );
};

/**
 * ===============================
 * GROUP
 * ===============================
 */
export const saveGroupStandings = async (groupId, rows) => {
  const ref = doc(db, "groups", groupId, "standings", "main");

  await setDoc(
    ref,
    {
      rows,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
};