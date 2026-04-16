import { db } from "@/services/firebase/firebase";
import {
  collection,
  getDocs,
  doc,
  setDoc,
} from "firebase/firestore";
import { buildStandings } from "@/utils/buildStandings";

export const recomputeStandings = async () => {
  const [matchesSnap, predictionsSnap, groupsSnap] = await Promise.all([
    getDocs(collection(db, "matches")),
    getDocs(collection(db, "predictions")),
    getDocs(collection(db, "groups")),
  ]);

  const matches = matchesSnap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  }));

  const predictions = predictionsSnap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  }));

  // ===== GLOBAL =====
  const global = buildStandings(predictions, matches);

  await setDoc(doc(db, "standings", "global"), {
    updatedAt: new Date(),
    table: global,
  });

  // ===== GROUPS =====
  for (const groupDoc of groupsSnap.docs) {
    const group = groupDoc.data();
    const members = group.members || [];

    const groupPredictions = predictions.filter((p) =>
      members.includes(p.uid)
    );

    const table = buildStandings(groupPredictions, matches);

    await setDoc(
      doc(db, "groups", groupDoc.id, "standings", "main"),
      {
        updatedAt: new Date(),
        table,
      }
    );
  }
};