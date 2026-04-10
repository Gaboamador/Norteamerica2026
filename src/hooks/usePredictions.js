import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  getUserPredictions,
  savePrediction,
} from "@/services/firebase/firebaseUtils";

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

    const load = async () => {
      setLoading(true);
      const data = await getUserPredictions(user.uid);
      setPredictions(data);
      setLoading(false);
    };

    load();
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

    // refrescar local
    const updated = await getUserPredictions(user.uid);
    setPredictions(updated);
  };

  return {
    predictions,
    loading,
    savePrediction: save,
  };
};