import { buildStandings } from "@/utils/buildStandings";

function getMillis(value) {
  if (!value) return 0;

  if (typeof value === "number") return value;

  if (typeof value?.toMillis === "function") {
    return value.toMillis();
  }

  const date = new Date(value);
  const millis = date.getTime();

  return Number.isFinite(millis) ? millis : 0;
}

function getMatchStartMillis(lockedMatch, officialMatch) {
  return (
    getMillis(lockedMatch?.s) ||
    getMillis(officialMatch?.startTime) ||
    0
  );
}

function getMatchDisplay(match) {
  const homeTeam = match?.homeTeam ?? "-";
  const awayTeam = match?.awayTeam ?? "-";
  const homeGoals = match?.result?.homeGoals;
  const awayGoals = match?.result?.awayGoals;

  const hasResult =
    homeGoals !== null &&
    homeGoals !== undefined &&
    awayGoals !== null &&
    awayGoals !== undefined;

  return {
    homeTeam,
    awayTeam,
    homeGoals: hasResult ? homeGoals : null,
    awayGoals: hasResult ? awayGoals : null,
    hasResult,
    label: hasResult
      ? `${homeTeam} ${homeGoals} - ${awayGoals} ${awayTeam}`
      : `${homeTeam} vs ${awayTeam}`,
  };
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

function addCutDeltas(table, previousTable = []) {
  const previousByUid = new Map(
    previousTable.map((row) => [row.uid, row])
  );

  return table.map((row) => {
    const previousRow = previousByUid.get(row.uid) ?? null;
    const previousPosition = previousRow?.position ?? null;
    const previousPoints = previousRow?.points ?? 0;

    return {
      ...row,
      previousPosition,
      movement:
        previousPosition === null
          ? 0
          : previousPosition - row.position,
      deltaPoints: row.points - previousPoints,
    };
  });
}

export function buildProdeTimeline({
  group,
  summary,
  matches,
}) {
  if (!group || !summary || !Array.isArray(matches)) {
    return [];
  }

  const officialById = new Map(
    matches.map((match) => [match.id, match])
  );

  const publishedFinishedMatches = Object.entries(summary.matches || {})
    .map(([matchId, lockedMatch]) => {
      const officialMatch = officialById.get(matchId);

      return {
        matchId,
        lockedMatch,
        officialMatch,
        startMillis: getMatchStartMillis(lockedMatch, officialMatch),
      };
    })
    .filter(({ officialMatch }) => Boolean(officialMatch?.result))
    .sort((a, b) => {
      if (a.startMillis !== b.startMillis) {
        return a.startMillis - b.startMillis;
      }

      return String(a.matchId).localeCompare(String(b.matchId));
    });

  const memberIds = Array.isArray(group.members) && group.members.length > 0
    ? group.members
    : Object.keys(summary.users || {});

  const usersMap = buildUsersMap(summary.users || {});
  let previousTable = [];

  return publishedFinishedMatches.map((cut, index) => {
    const matchesUntilCut = publishedFinishedMatches.slice(0, index + 1);
    const matchIdsUntilCut = matchesUntilCut.map((item) => item.matchId);

    const predictionsUntilCut = lockedSummaryToPredictions(
      summary,
      matchIdsUntilCut
    );

    const officialMatchesUntilCut = matchesUntilCut.map(
      (item) => item.officialMatch
    );

    const table = buildStandings(
      predictionsUntilCut,
      officialMatchesUntilCut,
      usersMap,
      memberIds
    );

    const tableWithDeltas = addCutDeltas(table, previousTable);
    previousTable = table;

    const matchDisplay = getMatchDisplay(cut.officialMatch);

    return {
      index,
      matchId: cut.matchId,
      match: cut.officialMatch,
      matchLabel: matchDisplay.label,
      matchDisplay,
      startMillis: cut.startMillis,
      table: tableWithDeltas,
    };
  });
}