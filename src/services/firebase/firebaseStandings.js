import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

/**
 * ===============================
 * GLOBAL
 * ===============================
 */
export const saveGlobalStandings = async (table) => {
  const ref = doc(db, "standings", "global");

  await setDoc(
    ref,
    {
      key: "global",
      label: "Tabla general",
      updatedAt: serverTimestamp(),
      table,
    },
    { merge: true }
  );
};

/**
 * ===============================
 * GROUP
 * ===============================
 */
export const saveGroupStandings = async (groupId, table) => {
  const ref = doc(db, "groups", groupId, "standings", "main");

  await setDoc(
    ref,
    {
      table,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
};