import { useEffect, useState, useRef } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/services/firebase/firebase";

export const useMultiGroupStandings = (groupIds) => {
  const [tables, setTables] = useState([]);
  const resultsRef = useRef({});

  useEffect(() => {
    if (!groupIds || groupIds.length === 0) {
      setTables([]);
      return;
    }

    resultsRef.current = {};

    const unsubscribes = [];

    groupIds.forEach((groupId) => {
      const ref = doc(
        db,
        "groups",
        groupId,
        "standings",
        "main"
      );

      const unsub = onSnapshot(ref, (snap) => {
        resultsRef.current[groupId] = snap.exists()
          ? snap.data().table || []
          : [];

        setTables(Object.values(resultsRef.current));
      });

      unsubscribes.push(unsub);
    });

    return () => unsubscribes.forEach((u) => u());
  }, [groupIds]);

  return tables;
};