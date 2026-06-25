import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getPredictionPoints } from "@/utils/predictionPoints";
import { formatDisplayName } from "@/utils/formatDisplayName";
import {
  getLockedPredictionsSessionSnapshot,
  loadLockedPredictionGroups,
  loadLockedPredictionSummary,
  resetLockedPredictionsSession,
  startLockedPredictionsSession,
  subscribeLockedPredictionsSession,
} from "@/stores/lockedPredictionsSessionStore";

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

  const [sessionState, setSessionState] = useState(() =>
    getLockedPredictionsSessionSnapshot()
  );

  useEffect(() => {
    const unsubscribe = subscribeLockedPredictionsSession(setSessionState);

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!user) {
      resetLockedPredictionsSession();
      return;
    }

    startLockedPredictionsSession(user);
  }, [user]);

  const loadGroups = useCallback(async () => {
    if (!user?.uid) return [];

    return loadLockedPredictionGroups(user);
  }, [user]);

  const loadSummary = useCallback(async (groupId) => {
    return loadLockedPredictionSummary(groupId);
  }, []);

  const getRowsForMatch = useCallback(
    (groupId, match) => {
      return buildRowsForMatch(sessionState.summaries[groupId], match);
    },
    [sessionState.summaries]
  );

  const value = useMemo(
    () => ({
      groups: sessionState.groups,
      groupsLoading: sessionState.groupsLoading,
      summaries: sessionState.summaries,
      loadingGroupIds: sessionState.loadingGroupIds,
      error: sessionState.error,
      loadGroups,
      loadSummary,
      getRowsForMatch,
    }),
    [
      sessionState.groups,
      sessionState.groupsLoading,
      sessionState.summaries,
      sessionState.loadingGroupIds,
      sessionState.error,
      loadGroups,
      loadSummary,
      getRowsForMatch,
    ]
  );

  return value;
}