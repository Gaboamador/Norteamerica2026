import { db } from "@/services/firebase/firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";

export async function getUserGroupsForLockedPredictions(uid) {
  if (!uid) return [];

  const groupsQuery = query(
    collection(db, "groups"),
    where("members", "array-contains", uid)
  );

  const snap = await getDocs(groupsQuery);

  return snap.docs.map((document) => ({
    id: document.id,
    ...document.data(),
  }));
}

export async function getLockedPredictionsSummary(groupId) {
  if (!groupId) return null;

  const summaryRef = doc(
    db,
    "groups",
    groupId,
    "lockedPredictions",
    "summary"
  );

  const snap = await getDoc(summaryRef);

  if (!snap.exists()) return null;

  return {
    id: snap.id,
    ...snap.data(),
  };
}