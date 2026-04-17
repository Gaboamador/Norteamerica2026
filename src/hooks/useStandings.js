import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/services/firebase/firebase";

export const useStandings = () => {
  const [table, setTable] = useState([]);

  useEffect(() => {
    const ref = doc(db, "standings", "global");

    const unsubscribe = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setTable(data.table || []);
      } else {
        setTable([]);
      }
    });

    return () => unsubscribe();
  }, []);

  return table;
};