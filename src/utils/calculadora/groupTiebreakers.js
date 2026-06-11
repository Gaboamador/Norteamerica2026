import { getEffectiveResult } from "./matchResultUtils";

function normalizeTieKeyValue(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function buildUnresolvedGroupId(group, rows) {
  const teamsKey = rows
    .map((row) => normalizeTieKeyValue(row.team))
    .sort()
    .join("__");

  return `group-${group}-tie-${teamsKey}`;
}

function getPlayedMatchesBetweenTeams(rows, groupMatches, sandboxResults) {
  const teams = new Set(rows.map((row) => row.team));

  return groupMatches
    .map((match) => {
      if (!teams.has(match.homeTeam) || !teams.has(match.awayTeam)) {
        return null;
      }

      const result = getEffectiveResult(match, sandboxResults);

      if (!result) return null;

      return {
        match,
        result,
      };
    })
    .filter(Boolean);
}

function buildHeadToHeadStats(rows, groupMatches, sandboxResults) {
  const statsByTeam = new Map(
    rows.map((row) => [
      row.team,
      {
        team: row.team,
        points: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDifference: 0,
      },
    ])
  );

  const matches = getPlayedMatchesBetweenTeams(
    rows,
    groupMatches,
    sandboxResults
  );

  matches.forEach(({ match, result }) => {
    const home = statsByTeam.get(match.homeTeam);
    const away = statsByTeam.get(match.awayTeam);

    if (!home || !away) return;

    const homeGoals = Number(result.homeGoals);
    const awayGoals = Number(result.awayGoals);

    home.goalsFor += homeGoals;
    home.goalsAgainst += awayGoals;

    away.goalsFor += awayGoals;
    away.goalsAgainst += homeGoals;

    if (homeGoals > awayGoals) {
      home.points += 3;
    } else if (homeGoals < awayGoals) {
      away.points += 3;
    } else {
      home.points += 1;
      away.points += 1;
    }
  });

  Array.from(statsByTeam.values()).forEach((stats) => {
    stats.goalDifference = stats.goalsFor - stats.goalsAgainst;
  });

  return statsByTeam;
}

function groupRowsByValue(rows, getValue) {
  const groupsByValue = new Map();

  rows.forEach((row) => {
    const value = getValue(row);

    if (!groupsByValue.has(value)) {
      groupsByValue.set(value, []);
    }

    groupsByValue.get(value).push(row);
  });

  return Array.from(groupsByValue.entries())
    .sort(([a], [b]) => b - a)
    .map(([, groupedRows]) => groupedRows);
}

function didSplit(rows, groupedRows) {
  return groupedRows.length > 1 && groupedRows.length < rows.length + 1;
}

function resolveHeadToHeadStep(rows, groupMatches, sandboxResults) {
  if (rows.length <= 1) return rows.map((row) => [row]);

  const headToHeadStats = buildHeadToHeadStats(
    rows,
    groupMatches,
    sandboxResults
  );

  const criteria = [
    (row) => headToHeadStats.get(row.team)?.points ?? 0,
    (row) => headToHeadStats.get(row.team)?.goalDifference ?? 0,
    (row) => headToHeadStats.get(row.team)?.goalsFor ?? 0,
  ];

  for (const criterion of criteria) {
    const groupedRows = groupRowsByValue(rows, criterion);

    if (didSplit(rows, groupedRows)) {
      return groupedRows.flatMap((grouped) => {
        if (grouped.length <= 1) return [grouped];

        return resolveHeadToHeadStep(grouped, groupMatches, sandboxResults);
      });
    }
  }

  return [rows];
}

function resolveStepTwo(rows) {
  if (rows.length <= 1) return rows.map((row) => [row]);

  const criteria = [
    (row) => row.goalDifference,
    (row) => row.goalsFor,
  ];

  let groups = [rows];

  criteria.forEach((criterion) => {
    groups = groups.flatMap((groupedRows) => {
      if (groupedRows.length <= 1) return [groupedRows];

      return groupRowsByValue(groupedRows, criterion);
    });
  });

  return groups;
}

function hasCompleteManualOrder(rows, manualOrderForGroup) {
  if (!manualOrderForGroup) return false;

  const manualValues = rows.map((row) => manualOrderForGroup[row.team]);

  const allDefined = manualValues.every(
    (value) => value !== null && value !== undefined && value !== ""
  );

  if (!allDefined) return false;

  const uniqueValues = new Set(manualValues.map(Number));

  return uniqueValues.size === rows.length;
}

function applyManualOrder(rows, manualOrderForGroup) {
  const unresolvedGroupId = buildUnresolvedGroupId(rows[0]?.group, rows);

  return [...rows]
    .sort((a, b) => {
      const aRank = Number(manualOrderForGroup[a.team]);
      const bRank = Number(manualOrderForGroup[b.team]);

      return aRank - bRank;
    })
    .map((row) => ({
      ...row,
      unresolvedTiebreaker: false,
      unresolvedGroupId,
      rankingStatus: "manual",
      manualTiebreakRank: Number(manualOrderForGroup[row.team]),
    }));
}

function markUnresolvedRows(group, rows, manualOrderForGroup) {
  const unresolvedGroupId = buildUnresolvedGroupId(group, rows);

  return [...rows]
    .sort((a, b) => a.team.localeCompare(b.team, "es"))
    .map((row) => ({
      ...row,
      unresolvedTiebreaker: true,
      unresolvedGroupId,
      rankingStatus: "unresolved",
      manualTiebreakRank: manualOrderForGroup?.[row.team] ?? null,
    }));
}

function resolveEqualPointsRows({
  group,
  rows,
  groupMatches,
  sandboxResults,
  manualTiebreakers,
}) {
  if (rows.length <= 1) return rows;

  const afterHeadToHead = resolveHeadToHeadStep(
    rows,
    groupMatches,
    sandboxResults
  );

  return afterHeadToHead.flatMap((headToHeadGroup) => {
    if (headToHeadGroup.length <= 1) return headToHeadGroup;

    const afterStepTwo = resolveStepTwo(headToHeadGroup);

    return afterStepTwo.flatMap((stepTwoGroup) => {
      if (stepTwoGroup.length <= 1) return stepTwoGroup;

      const unresolvedGroupId = buildUnresolvedGroupId(group, stepTwoGroup);
      const manualOrderForGroup = manualTiebreakers?.[unresolvedGroupId];

      if (hasCompleteManualOrder(stepTwoGroup, manualOrderForGroup)) {
        return applyManualOrder(stepTwoGroup, manualOrderForGroup);
      }

      return markUnresolvedRows(group, stepTwoGroup, manualOrderForGroup);
    });
  });
}

export function sortGroupRowsWithTiebreakers({
  group,
  rows,
  groupMatches,
  sandboxResults,
  manualTiebreakers,
}) {
  const pointsGroups = groupRowsByValue(rows, (row) => row.points);

  return pointsGroups.flatMap((rowsWithSamePoints) =>
    resolveEqualPointsRows({
      group,
      rows: rowsWithSamePoints,
      groupMatches,
      sandboxResults,
      manualTiebreakers,
    })
  );
}