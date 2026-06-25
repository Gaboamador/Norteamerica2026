import {
  collection,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/services/firebase/firebase";

const EMPTY_STATE = {
  uid: null,
  predictions: [],
  loading: false,
  error: null,
  started: false,
};

let state = { ...EMPTY_STATE };
let unsubscribeFirestore = null;

const subscribers = new Set();

function notify() {
  subscribers.forEach((callback) => callback(state));
}

function setState(patch) {
  state = {
    ...state,
    ...patch,
  };

  notify();
}

function closeFirestoreListener() {
  if (typeof unsubscribeFirestore === "function") {
    unsubscribeFirestore();
  }

  unsubscribeFirestore = null;
}

export function getPredictionsSessionSnapshot() {
  return state;
}

export function subscribePredictionsSession(callback) {
  subscribers.add(callback);

  return () => {
    subscribers.delete(callback);
  };
}

export function resetPredictionsSession() {
  closeFirestoreListener();

  state = { ...EMPTY_STATE };
  notify();
}

export function startPredictionsSession(user) {
  const uid = user?.uid;

  if (!uid) {
    resetPredictionsSession();
    return;
  }

  if (state.started && state.uid === uid && unsubscribeFirestore) {
    return;
  }

  closeFirestoreListener();

  setState({
    uid,
    predictions: [],
    loading: true,
    error: null,
    started: true,
  });

  const predictionsQuery = query(
    collection(db, "predictions"),
    where("uid", "==", uid)
  );

  unsubscribeFirestore = onSnapshot(
    predictionsQuery,
    (snapshot) => {
      const predictions = snapshot.docs.map((document) => ({
        id: document.id,
        ...document.data(),
      }));

      setState({
        uid,
        predictions,
        loading: false,
        error: null,
        started: true,
      });
    },
    (error) => {
      console.error("Error escuchando predicciones del usuario", error);

      setState({
        loading: false,
        error,
        started: true,
      });
    }
  );
}

export function upsertPredictionInSession(prediction) {
  if (!prediction?.id) return;

  setState({
    predictions: [
      ...state.predictions.filter((item) => item.id !== prediction.id),
      prediction,
    ],
  });
}