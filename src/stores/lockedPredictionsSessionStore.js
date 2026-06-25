import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/services/firebase/firebase";
import {
  getLockedPredictionsSummary,
  getUserGroupsForLockedPredictions,
} from "@/services/firebase/firebaseLockedPredictionsRead";

const LOCKED_PREDICTIONS_META_REF = doc(db, "meta", "lockedPredictions");

const EMPTY_STATE = {
  uid: null,
  groups: [],
  groupsLoading: false,
  summaries: {},
  loadingGroupIds: {},
  error: null,
  started: false,
  metaSig: null,
};

let state = { ...EMPTY_STATE };

let unsubscribeMeta = null;
let groupsPromise = null;
let summaryPromises = {};
let cacheGeneration = 0;

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

function getMetaSigFromSnapshot(snapshot) {
  if (!snapshot.exists()) return "missing";

  const data = snapshot.data();

  const version = Number(data.version || 0);
  const updatedAtMillis = Number(data.updatedAtMillis || 0);
  const publishedCount = Array.isArray(data.publishedMatchIds)
    ? data.publishedMatchIds.length
    : 0;

  return `${version}:${updatedAtMillis}:${publishedCount}`;
}

function normalizeGroups(groups) {
  return Array.isArray(groups)
    ? groups.map((group) => ({
        id: group.id,
        name: group.name || "Grupo",
        members: Array.isArray(group.members) ? group.members : [],
      }))
    : [];
}

function closeMetaListener() {
  if (typeof unsubscribeMeta === "function") {
    unsubscribeMeta();
  }

  unsubscribeMeta = null;
}

function startMetaListener() {
  if (unsubscribeMeta) {
    return;
  }

  unsubscribeMeta = onSnapshot(
    LOCKED_PREDICTIONS_META_REF,
    (snapshot) => {

      const nextMetaSig = getMetaSigFromSnapshot(snapshot);
      const previousMetaSig = state.metaSig;

      /**
       * Primera lectura de meta:
       * sólo guardamos la firma.
       *
       * Lecturas siguientes:
       * si cambia la firma, invalidamos summaries cacheados porque puede haber
       * nuevos partidos bloqueados publicados.
       */
      if (previousMetaSig && previousMetaSig !== nextMetaSig) {

        cacheGeneration += 1;
        summaryPromises = {};

        setState({
          metaSig: nextMetaSig,
          summaries: {},
          loadingGroupIds: {},
        });

        return;
      }

      setState({
        metaSig: nextMetaSig,
      });
    },
    (error) => {
      console.error("Error leyendo meta/lockedPredictions", error);

      setState({
        error: "No se pudo verificar la publicación de pronósticos bloqueados.",
      });
    }
  );
}

export function getLockedPredictionsSessionSnapshot() {
  return state;
}

export function subscribeLockedPredictionsSession(callback) {
  subscribers.add(callback);

  return () => {
    subscribers.delete(callback);
  };
}

export function resetLockedPredictionsSession() {

  closeMetaListener();

  groupsPromise = null;
  summaryPromises = {};
  cacheGeneration += 1;

  state = { ...EMPTY_STATE };

  notify();
}

export function startLockedPredictionsSession(user) {
  const uid = user?.uid;

  if (!uid) {
    resetLockedPredictionsSession();
    return;
  }

  if (state.started && state.uid === uid) {
    startMetaListener();
    return;
  }

  groupsPromise = null;
  summaryPromises = {};
  cacheGeneration += 1;

  setState({
    uid,
    groups: [],
    groupsLoading: false,
    summaries: {},
    loadingGroupIds: {},
    error: null,
    started: true,
    metaSig: state.metaSig,
  });

  startMetaListener();
}

export async function loadLockedPredictionGroups(user) {
  const uid = user?.uid;

  if (!uid) return [];

  startLockedPredictionsSession(user);

  if (state.groups.length > 0) {
    return state.groups;
  }

  if (groupsPromise) {
    return groupsPromise;
  }

  setState({
    groupsLoading: true,
    error: null,
  });

  groupsPromise = getUserGroupsForLockedPredictions(uid)
    .then((groups) => {
      const normalizedGroups = normalizeGroups(groups);

      setState({
        groups: normalizedGroups,
        groupsLoading: false,
        error: null,
      });

      return normalizedGroups;
    })
    .catch((error) => {
      console.error("Error cargando grupos para pronósticos bloqueados", error);

      setState({
        groupsLoading: false,
        error: "No se pudieron cargar tus grupos.",
      });

      return [];
    })
    .finally(() => {
      groupsPromise = null;
    });

  return groupsPromise;
}

export async function loadLockedPredictionSummary(groupId) {
  if (!groupId) return null;

  const cachedSummary = state.summaries[groupId];

  if (cachedSummary) {
    return cachedSummary;
  }

  if (summaryPromises[groupId]) {
    return summaryPromises[groupId];
  }

  const requestGeneration = cacheGeneration;

  setState({
    error: null,
    loadingGroupIds: {
      ...state.loadingGroupIds,
      [groupId]: true,
    },
  });

  summaryPromises[groupId] = getLockedPredictionsSummary(groupId)
    .then(async (summary) => {
      /**
       * Si cambió meta/lockedPredictions mientras estábamos pidiendo este summary,
       * descartamos la respuesta y hacemos una segunda lectura limpia.
       */
      if (requestGeneration !== cacheGeneration) {

        delete summaryPromises[groupId];

        setState({
          loadingGroupIds: {
            ...state.loadingGroupIds,
            [groupId]: false,
          },
        });

        return loadLockedPredictionSummary(groupId);
      }

      setState({
        summaries: {
          ...state.summaries,
          [groupId]: summary,
        },
        loadingGroupIds: {
          ...state.loadingGroupIds,
          [groupId]: false,
        },
        error: null,
      });

      return summary;
    })
    .catch((error) => {
      console.error("Error cargando pronósticos bloqueados", error);

      setState({
        loadingGroupIds: {
          ...state.loadingGroupIds,
          [groupId]: false,
        },
        error: "No se pudieron cargar los pronósticos del grupo.",
      });

      return null;
    })
    .finally(() => {
      delete summaryPromises[groupId];
    });

  return summaryPromises[groupId];
}