import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/services/firebase/firebase";
import { useAuth } from "@/hooks/useAuth";

export const useUserGroupsState = () => {
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    
    if (!user) {
      setGroups([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const q = query(
      collection(db, "groups"),
      where("members", "array-contains", user.uid)
    );

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const data = snap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setGroups(data);
        setLoading(false);
      },
      (error) => {
        console.error("Error cargando grupos del usuario:", error);
        setGroups([]);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  return { groups, loading };
};

export const useUserGroups = () => {
  const { groups } = useUserGroupsState();
  return groups;
};