import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { savePrediction as savePredictionToFirebase } from "@/services/firebase/firebaseUtils";
import {
  getPredictionsSessionSnapshot,
  resetPredictionsSession,
  startPredictionsSession,
  subscribePredictionsSession,
  upsertPredictionInSession,
} from "@/stores/predictionsSessionStore";

function buildPredictionId(uid, matchId) {
  return `${uid}_${matchId}`;
}

export const usePredictions = () => {
  const { user } = useAuth();

  const [sessionState, setSessionState] = useState(() =>
    getPredictionsSessionSnapshot()
  );

  useEffect(() => {
    const unsubscribe = subscribePredictionsSession(setSessionState);

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!user) {
      resetPredictionsSession();
      return;
    }

    startPredictionsSession(user);
  }, [user]);

  const save = async (matchId, predHome, predAway) => {
    if (!user) throw new Error("Usuario no autenticado");

    await savePredictionToFirebase({
      uid: user.uid,
      displayName: user.displayName,
      matchId,
      predHome,
      predAway,
    });

    /**
     * Actualización local inmediata.
     *
     * El onSnapshot también va a traer este cambio desde Firestore.
     * Esto sólo evita que la UI dependa de ese roundtrip para verse actualizada.
     */
    upsertPredictionInSession({
      id: buildPredictionId(user.uid, matchId),
      uid: user.uid,
      displayName: user.displayName || null,
      matchId,
      predHome,
      predAway,
    });
  };

  return {
    predictions: sessionState.predictions,
    loading: sessionState.loading,
    savePrediction: save,
  };
};