function normalizeTieKeyValue(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function buildBestThirdsUnresolvedGroupId(rows) {
  const teamsKey = rows
    .map((row) => `${row.group}-${normalizeTieKeyValue(row.team)}`)
    .sort()
    .join("__");

  return `best-thirds-tie-${teamsKey}`;
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

function hasCompleteManualOrder(rows, manualOrderForGroup) {
  if (!manualOrderForGroup) return false;

  const manualValues = rows.map((row) => manualOrderForGroup[row.teamKey]);

  const allDefined = manualValues.every(
    (value) => value !== null && value !== undefined && value !== ""
  );

  if (!allDefined) return false;

  const uniqueValues = new Set(manualValues.map(Number));

  return uniqueValues.size === rows.length;
}

function applyManualOrder(rows, manualOrderForGroup) {
  const unresolvedGroupId = buildBestThirdsUnresolvedGroupId(rows);

  return [...rows]
    .sort((a, b) => {
      const aRank = Number(manualOrderForGroup[a.teamKey]);
      const bRank = Number(manualOrderForGroup[b.teamKey]);

      return aRank - bRank;
    })
    .map((row) => ({
      ...row,
      unresolvedTiebreaker: false,
      unresolvedGroupId,
      rankingStatus: "manual",
      manualTiebreakRank: Number(manualOrderForGroup[row.teamKey]),
    }));
}

function markUnresolvedRows(rows, manualOrderForGroup) {
  const unresolvedGroupId = buildBestThirdsUnresolvedGroupId(rows);

  return [...rows]
    .sort((a, b) => {
      const groupCompare = a.group.localeCompare(b.group, "es");
      if (groupCompare !== 0) return groupCompare;

      return a.team.localeCompare(b.team, "es");
    })
    .map((row) => ({
      ...row,
      unresolvedTiebreaker: true,
      unresolvedGroupId,
      rankingStatus: "unresolved",
      manualTiebreakRank: manualOrderForGroup?.[row.teamKey] ?? null,
    }));
}

function resolveBestThirdsTie(rows, manualTiebreakers) {
  if (rows.length <= 1) return rows;

  const unresolvedGroupId = buildBestThirdsUnresolvedGroupId(rows);
  const manualOrderForGroup = manualTiebreakers?.[unresolvedGroupId];

  if (hasCompleteManualOrder(rows, manualOrderForGroup)) {
    return applyManualOrder(rows, manualOrderForGroup);
  }

  return markUnresolvedRows(rows, manualOrderForGroup);
}

function sortThirdsWithTiebreakers(rows, manualTiebreakers) {
  let groups = [rows];

  const criteria = [
    (row) => row.points,
    (row) => row.goalDifference,
    (row) => row.goalsFor,
  ];

  criteria.forEach((criterion) => {
    groups = groups.flatMap((groupedRows) => {
      if (groupedRows.length <= 1) return [groupedRows];

      return groupRowsByValue(groupedRows, criterion);
    });
  });

  return groups.flatMap((groupedRows) =>
    resolveBestThirdsTie(groupedRows, manualTiebreakers)
  );
}

export function buildBestThirdsTable({ groupTablesByGroup, manualTiebreakers }) {
  const thirdRows = Object.entries(groupTablesByGroup)
    .map(([group, rows]) => {
      const third = rows?.[2];

      if (!third) return null;

      return {
        ...third,
        group,
        groupPosition: 3,
        teamKey: `${group}__${third.team}`,
        sourceGroupUnresolved: Boolean(third.unresolvedTiebreaker),
        unresolvedTiebreaker: false,
        unresolvedGroupId: null,
        manualTiebreakRank: null,
        rankingStatus: third.rankingStatus === "manual" ? "automatic" : "automatic",
      };
    })
    .filter(Boolean);

  const sortedRows = sortThirdsWithTiebreakers(
    thirdRows,
    manualTiebreakers
  );

  return sortedRows.map((row, index) => ({
    ...row,
    position: index + 1,
    bestThirdStatus: index < 8 ? "qualified" : "eliminated",
  }));
}