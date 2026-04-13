import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/services/firebase/firebase";

export const useAllGroups = () => {
  const [groups, setGroups] = useState([]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "groups"), (snap) => {
      const data = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setGroups(data);
    });

    return () => unsub();
  }, []);

  return groups;
};