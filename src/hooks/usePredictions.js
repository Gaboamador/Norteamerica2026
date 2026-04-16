import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  collection,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/services/firebase/firebase";
import { savePrediction } from "@/services/firebase/firebaseUtils";

export const usePredictions = () => {
  const { user } = useAuth();

  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setPredictions([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, "predictions"),
      where("uid", "==", user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setPredictions(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const save = async (matchId, predHome, predAway) => {
    if (!user) throw new Error("Usuario no autenticado");

    await savePrediction({
      uid: user.uid,
      displayName: user.displayName,
      matchId,
      predHome,
      predAway,
    });
  };

  return {
    predictions,
    loading,
    savePrediction: save,
  };
};