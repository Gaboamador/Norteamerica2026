import { buildStandings } from "@/utils/buildStandings";

function getMillis(value) {
  if (!value) return 0;

  if (typeof value === "number") return value;

  if (typeof value?.toMillis === "function") {
    return value.toMillis();
  }

  if (value?.seconds !== undefined) {
    return value.seconds * 1000 + Math.floor((value.nanoseconds || 0) / 1000000);
  }

  const parsed = new Date(value).getTime();

  return Number.isFinite(parsed) ? parsed : 0;
}

function isValidGoalValue(value) {
  if (value === null || value === undefined) return false;

  const raw = String(value).trim();

  if (raw === "") return false;

  const parsed = Number(raw);

  return Number.isInteger(parsed) && parsed >= 0 && parsed <= 20;
}

function normalizeGoalValue(value) {
  return Number(String(value).trim());
}

function isMatchLockedLocally(match) {
  const lockMillis = getMillis(match?.lockTime);

  if (!lockMillis) return false;

  return Date.now() >= lockMillis;
}

function buildUsersMap(summaryUsers = {}) {
  return Object.fromEntries(
    Object.entries(summaryUsers).map(([uid, user]) => [
      uid,
      {
        id: uid,
        displayName: user?.n || "Usuario",
        email: user?.email || "",
        photoURL: user?.photoURL || null,
      },
    ])
  );
}

function lockedSummaryToPredictions(summary, matchIds) {
  return matchIds.flatMap((matchId) => {
    const matchData = summary?.matches?.[matchId];
    const predictionsByUid = matchData?.p || {};

    return Object.entries(predictionsByUid).map(([uid, score]) => ({
      uid,
      matchId,
      predHome: Array.isArray(score) ? score[0] : null,
      predAway: Array.isArray(score) ? score[1] : null,
    }));
  });
}

function addSimulationDeltas(table, baseTable = []) {
  const baseByUid = new Map(baseTable.map((row) => [row.uid, row]));

  return table.map((row) => {
    const baseRow = baseByUid.get(row.uid) ?? null;
    const basePosition = baseRow?.position ?? null;
    const basePoints = baseRow?.points ?? 0;

    return {
      ...row,
      basePosition,
      basePoints,
      movement:
        basePosition === null
          ? 0
          : basePosition - row.position,
      deltaPoints: row.points - basePoints,
    };
  });
}

function getCompleteSimulatedResult(simulatedResultsByMatchId, matchId) {
  const simulated = simulatedResultsByMatchId?.[matchId];

  if (
    !isValidGoalValue(simulated?.homeGoals) ||
    !isValidGoalValue(simulated?.awayGoals)
  ) {
    return null;
  }

  return {
    homeGoals: normalizeGoalValue(simulated.homeGoals),
    awayGoals: normalizeGoalValue(simulated.awayGoals),
  };
}

function getPublishedOfficialMatches({ summary, matches }) {
  const officialById = new Map(matches.map((match) => [match.id, match]));

  return Object.keys(summary?.matches || {})
    .map((matchId) => officialById.get(matchId))
    .filter((match) => Boolean(match?.result))
    .sort((a, b) => {
      const aTime = getMillis(a?.startTime);
      const bTime = getMillis(b?.startTime);

      if (aTime !== bTime) return aTime - bTime;

      return String(a?.id || "").localeCompare(String(b?.id || ""));
    });
}

function getEffectiveScoredMatches({
  summary,
  matches,
  simulatedResultsByMatchId,
}) {
  const officialById = new Map(matches.map((match) => [match.id, match]));

  return Object.keys(summary?.matches || {})
    .map((matchId) => {
      const officialMatch = officialById.get(matchId);

      if (!officialMatch) return null;

      if (officialMatch.result) {
        return officialMatch;
      }

      const simulatedResult = getCompleteSimulatedResult(
        simulatedResultsByMatchId,
        matchId
      );

      if (!simulatedResult) return null;

      return {
        ...officialMatch,
        result: simulatedResult,
        status: "finished",
        simulated: true,
      };
    })
    .filter(Boolean)
    .sort((a, b) => {
      const aTime = getMillis(a?.startTime);
      const bTime = getMillis(b?.startTime);

      if (aTime !== bTime) return aTime - bTime;

      return String(a?.id || "").localeCompare(String(b?.id || ""));
    });
}

export function getSimulationCandidateMatches({
  currentMatch,
  summary,
  matches,
}) {
  if (!currentMatch || !summary || !Array.isArray(matches)) {
    return [];
  }

  const isCurrentGroupStageMatch =
    currentMatch.group && Number(currentMatch.round) <= 3;

  return matches
    .filter((match) => {
      if (!match?.id) return false;
      if (match.result) return false;
      if (!summary?.matches?.[match.id]) return false;
      if (!isMatchLockedLocally(match)) return false;

      if (isCurrentGroupStageMatch) {
        return match.group === currentMatch.group && Number(match.round) <= 3;
      }

      return match.id === currentMatch.id;
    })
    .sort((a, b) => {
      const aTime = getMillis(a?.startTime);
      const bTime = getMillis(b?.startTime);

      if (aTime !== bTime) return aTime - bTime;

      return String(a?.id || "").localeCompare(String(b?.id || ""));
    });
}

export function buildSimulatedProdeStandings({
  group,
  summary,
  matches,
  simulatedResultsByMatchId = {},
}) {
  if (!group || !summary || !Array.isArray(matches)) {
    return {
      table: [],
      baseTable: [],
      simulatedMatchIds: [],
    };
  }

  const memberIds =
    Array.isArray(group.members) && group.members.length > 0
      ? group.members
      : Object.keys(summary.users || {});

  const usersMap = buildUsersMap(summary.users || {});

  const officialMatches = getPublishedOfficialMatches({
    summary,
    matches,
  });

  const effectiveMatches = getEffectiveScoredMatches({
    summary,
    matches,
    simulatedResultsByMatchId,
  });

  const officialMatchIds = officialMatches.map((match) => match.id);
  const effectiveMatchIds = effectiveMatches.map((match) => match.id);

  const basePredictions = lockedSummaryToPredictions(
    summary,
    officialMatchIds
  );

  const simulatedPredictions = lockedSummaryToPredictions(
    summary,
    effectiveMatchIds
  );

  const baseTable = buildStandings(
    basePredictions,
    officialMatches,
    usersMap,
    memberIds
  );

  const table = buildStandings(
    simulatedPredictions,
    effectiveMatches,
    usersMap,
    memberIds
  );

  const officialIdSet = new Set(officialMatchIds);

  const simulatedMatchIds = effectiveMatchIds.filter(
    (matchId) => !officialIdSet.has(matchId)
  );

  return {
    baseTable,
    table: addSimulationDeltas(table, baseTable),
    simulatedMatchIds,
  };
}