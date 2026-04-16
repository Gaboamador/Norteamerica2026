import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/services/firebase/firebase";

export const useGroupStandings = (groupId) => {
  const [table, setTable] = useState([]);

  useEffect(() => {
    if (!groupId) {
      setTable([]);
      return;
    }

    const ref = doc(
      db,
      "groups",
      groupId,
      "standings",
      "main"
    );

    const unsubscribe = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setTable(data.table || []);
      } else {
        setTable([]);
      }
    });

    return () => unsubscribe();
  }, [groupId]);

  return table;
};