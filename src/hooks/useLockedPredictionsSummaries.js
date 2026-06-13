import { useCallback, useMemo, useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getPredictionPoints } from "@/utils/predictionPoints";
import { formatDisplayName } from "@/utils/formatDisplayName";
import {
  getLockedPredictionsSummary,
  getUserGroupsForLockedPredictions,
} from "@/services/firebase/firebaseLockedPredictionsRead";

function normalizeGroups(groups) {
  return Array.isArray(groups)
    ? groups.map((group) => ({
        id: group.id,
        name: group.name || "Grupo",
        members: Array.isArray(group.members) ? group.members : [],
      }))
    : [];
}

function buildRowsForMatch(summary, match) {
  const matchId = match?.id;
  const matchData = summary?.matches?.[matchId];

  if (!matchData?.p) return [];

  const users = summary.users || {};

  return Object.entries(matchData.p)
    .map(([uid, prediction]) => {
      const predHome = Array.isArray(prediction) ? prediction[0] : null;
      const predAway = Array.isArray(prediction) ? prediction[1] : null;

      const matchPoints = getPredictionPoints(
        {
          predHome,
          predAway,
        },
        match
      );

      return {
        uid,
        displayName: formatDisplayName(users?.[uid]?.n, null),
        predHome,
        predAway,
        matchPoints,
      };
    })
    .sort((a, b) =>
        String(a.displayName || "").localeCompare(String(b.displayName || ""), "es")
    );
}

export function useLockedPredictionsSummaries() {
  const { user } = useAuth();

  const groupsRef = useRef(null);
  const summariesRef = useRef({});

  const [groups, setGroups] = useState([]);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [summaries, setSummaries] = useState({});
  const [loadingGroupIds, setLoadingGroupIds] = useState({});
  const [error, setError] = useState(null);

  const loadGroups = useCallback(async () => {
    if (!user?.uid) return [];

    if (groupsRef.current) {
      return groupsRef.current;
    }

    try {
      setError(null);
      setGroupsLoading(true);

      const loadedGroups = normalizeGroups(
        await getUserGroupsForLockedPredictions(user.uid)
      );

      groupsRef.current = loadedGroups;
      setGroups(loadedGroups);

      return loadedGroups;
    } catch (err) {
      console.error("Error cargando grupos para pronósticos bloqueados", err);
      setError("No se pudieron cargar tus grupos.");
      return [];
    } finally {
      setGroupsLoading(false);
    }
  }, [user]);

  const loadSummary = useCallback(async (groupId) => {
    if (!groupId) return null;

    if (summariesRef.current[groupId]) {
      return summariesRef.current[groupId];
    }

    try {
      setError(null);

      setLoadingGroupIds((current) => ({
        ...current,
        [groupId]: true,
      }));

      const summary = await getLockedPredictionsSummary(groupId);

      summariesRef.current[groupId] = summary;

      setSummaries((current) => ({
        ...current,
        [groupId]: summary,
      }));

      return summary;
    } catch (err) {
      console.error("Error cargando pronósticos bloqueados", err);
      setError("No se pudieron cargar los pronósticos del grupo.");
      return null;
    } finally {
      setLoadingGroupIds((current) => ({
        ...current,
        [groupId]: false,
      }));
    }
  }, []);

  const getRowsForMatch = useCallback(
  (groupId, match) => {
    return buildRowsForMatch(summaries[groupId], match);
  },
  [summaries]
);

  const value = useMemo(
    () => ({
      groups,
      groupsLoading,
      summaries,
      loadingGroupIds,
      error,
      loadGroups,
      loadSummary,
      getRowsForMatch,
    }),
    [
      groups,
      groupsLoading,
      summaries,
      loadingGroupIds,
      error,
      loadGroups,
      loadSummary,
      getRowsForMatch,
    ]
  );

  return value;
}