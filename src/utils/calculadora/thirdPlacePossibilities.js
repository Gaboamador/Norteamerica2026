import { THIRD_PLACE_MATRIX } from "./thirdPlaceMatrix";
import {
  WORLD_CUP_GROUPS,
  getEffectiveResult,
  getGroupMatches,
  getGroupTeams,
  isGroupEffectivelyClosed,
} from "./matchResultUtils";

const THIRD_PLACE_COLUMNS = ["1A", "1B", "1D", "1E", "1G", "1I", "1K", "1L"];

function normalizeGroup(value) {
  return String(value || "").replace("3", "").trim();
}

function parseMatrixOptions() {
  return Object.entries(THIRD_PLACE_MATRIX).map(
    ([qualifiedGroupsKey, assignment]) => ({
      option: assignment.option,
      qualifiedGroupsKey,
      qualifiedGroups: qualifiedGroupsKey.split("").sort(),
      assignment,
    })
  );
}

function getThirdRowsByGroup(bestThirdsTable = []) {
  return Object.fromEntries(
    bestThirdsTable
      .filter((row) => row?.group)
      .map((row) => [row.group, row])
  );
}

function getEffectivelyClosedGroups({ matches = [], sandboxResults = {} }) {
  return new Set(
    WORLD_CUP_GROUPS.filter((group) => {
      const groupMatches = getGroupMatches(matches, group);

      return isGroupEffectivelyClosed(groupMatches, sandboxResults);
    })
  );
}

function compareRowsByBestThirdCriteria(rowA, rowB) {
  if (!rowA?.group || !rowB?.group) return null;

  const criteria = [
    "points",
    "goalDifference",
    "goalsFor",
  ];

  for (const key of criteria) {
    const valueA = Number(rowA[key] ?? 0);
    const valueB = Number(rowB[key] ?? 0);

    if (valueA > valueB) {
      return {
        better: rowA.group,
        worse: rowB.group,
        reason: key,
      };
    }

    if (valueB > valueA) {
      return {
        better: rowB.group,
        worse: rowA.group,
        reason: key,
      };
    }
  }

  return null;
}

/**
 * Relación definitiva entre dos terceros de grupos ya cerrados.
 * Si llegan empatados a fair play / ranking FIFA, no inventa desempate.
 */
function compareClosedThirdRows(rowA, rowB, effectivelyClosedGroups) {
  if (!rowA?.group || !rowB?.group) return null;

  if (
    !effectivelyClosedGroups.has(rowA.group) ||
    !effectivelyClosedGroups.has(rowB.group)
  ) {
    return null;
  }

  return compareRowsByBestThirdCriteria(rowA, rowB);
}

function createInitialPointsByTeam(groupMatches, sandboxResults) {
  const teams = getGroupTeams(groupMatches);
  const pointsByTeam = Object.fromEntries(teams.map((team) => [team, 0]));
  const pendingMatches = [];

  groupMatches.forEach((match) => {
    const result = getEffectiveResult(match, sandboxResults);

    if (!result) {
      pendingMatches.push(match);
      return;
    }

    if (!(match.homeTeam in pointsByTeam)) pointsByTeam[match.homeTeam] = 0;
    if (!(match.awayTeam in pointsByTeam)) pointsByTeam[match.awayTeam] = 0;

    const homeGoals = Number(result.homeGoals);
    const awayGoals = Number(result.awayGoals);

    if (homeGoals > awayGoals) {
      pointsByTeam[match.homeTeam] += 3;
    } else if (homeGoals < awayGoals) {
      pointsByTeam[match.awayTeam] += 3;
    } else {
      pointsByTeam[match.homeTeam] += 1;
      pointsByTeam[match.awayTeam] += 1;
    }
  });

  return {
    pointsByTeam,
    pendingMatches,
  };
}

function getThirdPointsFromPointsTable(pointsByTeam) {
  const points = Object.values(pointsByTeam)
    .map(Number)
    .sort((a, b) => b - a);

  return points[2] ?? 0;
}

/**
 * Calcula el rango matemático posible de puntos del 3° de cada grupo.
 *
 * Importante:
 * - Sólo usa puntos para relaciones contra grupos pendientes.
 * - Eso es deliberado: diferencia de gol / goles a favor futuros pueden variar.
 * - Si los puntos no alcanzan para bloquear una relación, no se descarta.
 */
function buildThirdPointsBoundsForGroup({
  group,
  matches = [],
  sandboxResults = {},
}) {
  const groupMatches = getGroupMatches(matches, group);

  if (!groupMatches.length) {
    return {
      group,
      minThirdPoints: 0,
      maxThirdPoints: 0,
      pendingMatchCount: 0,
    };
  }

  const { pointsByTeam, pendingMatches } = createInitialPointsByTeam(
    groupMatches,
    sandboxResults
  );

  let minThirdPoints = Number.POSITIVE_INFINITY;
  let maxThirdPoints = Number.NEGATIVE_INFINITY;

  function visit(matchIndex, currentPointsByTeam) {
    if (matchIndex >= pendingMatches.length) {
      const thirdPoints = getThirdPointsFromPointsTable(currentPointsByTeam);

      minThirdPoints = Math.min(minThirdPoints, thirdPoints);
      maxThirdPoints = Math.max(maxThirdPoints, thirdPoints);

      return;
    }

    const match = pendingMatches[matchIndex];
    const homeTeam = match.homeTeam;
    const awayTeam = match.awayTeam;

    const base = {
      ...currentPointsByTeam,
      [homeTeam]: currentPointsByTeam[homeTeam] ?? 0,
      [awayTeam]: currentPointsByTeam[awayTeam] ?? 0,
    };

    // Local gana
    visit(matchIndex + 1, {
      ...base,
      [homeTeam]: base[homeTeam] + 3,
    });

    // Empate
    visit(matchIndex + 1, {
      ...base,
      [homeTeam]: base[homeTeam] + 1,
      [awayTeam]: base[awayTeam] + 1,
    });

    // Visitante gana
    visit(matchIndex + 1, {
      ...base,
      [awayTeam]: base[awayTeam] + 3,
    });
  }

  visit(0, pointsByTeam);

  return {
    group,
    minThirdPoints:
      minThirdPoints === Number.POSITIVE_INFINITY ? 0 : minThirdPoints,
    maxThirdPoints:
      maxThirdPoints === Number.NEGATIVE_INFINITY ? 0 : maxThirdPoints,
    pendingMatchCount: pendingMatches.length,
  };
}

function buildThirdPointsBoundsByGroup({ matches = [], sandboxResults = {} }) {
  return Object.fromEntries(
    WORLD_CUP_GROUPS.map((group) => [
      group,
      buildThirdPointsBoundsForGroup({
        group,
        matches,
        sandboxResults,
      }),
    ])
  );
}

function compareThirdBounds(boundsA, boundsB) {
  if (!boundsA?.group || !boundsB?.group) return null;

  if (boundsA.minThirdPoints > boundsB.maxThirdPoints) {
    return {
      better: boundsA.group,
      worse: boundsB.group,
      reason: "locked-points-bounds",
      minBetterThirdPoints: boundsA.minThirdPoints,
      maxWorseThirdPoints: boundsB.maxThirdPoints,
    };
  }

  if (boundsB.minThirdPoints > boundsA.maxThirdPoints) {
    return {
      better: boundsB.group,
      worse: boundsA.group,
      reason: "locked-points-bounds",
      minBetterThirdPoints: boundsB.minThirdPoints,
      maxWorseThirdPoints: boundsA.maxThirdPoints,
    };
  }

  return null;
}

function dedupeRelations(relations) {
  const seen = new Set();

  return relations.filter((relation) => {
    if (!relation?.better || !relation?.worse) return false;

    const key = `${relation.better}>${relation.worse}`;

    if (seen.has(key)) return false;

    seen.add(key);
    return true;
  });
}

function buildKnownRelations({
  matches = [],
  sandboxResults = {},
  bestThirdsTable = [],
  effectivelyClosedGroups,
}) {
  const rowsByGroup = getThirdRowsByGroup(bestThirdsTable);
  const boundsByGroup = buildThirdPointsBoundsByGroup({
    matches,
    sandboxResults,
  });

  const relations = [];

  WORLD_CUP_GROUPS.forEach((groupA, indexA) => {
    WORLD_CUP_GROUPS.slice(indexA + 1).forEach((groupB) => {
      const closedRelation = compareClosedThirdRows(
        rowsByGroup[groupA],
        rowsByGroup[groupB],
        effectivelyClosedGroups
      );

      if (closedRelation) {
        relations.push({
          ...closedRelation,
          source: "closed-third-rows",
        });

        return;
      }

      const boundsRelation = compareThirdBounds(
        boundsByGroup[groupA],
        boundsByGroup[groupB]
      );

      if (boundsRelation) {
        relations.push({
          ...boundsRelation,
          source: "points-bounds",
        });
      }
    });
  });

  return dedupeRelations(relations);
}

function isOptionPossible(option, knownRelations) {
  const qualifiedGroups = new Set(option.qualifiedGroups);

  return knownRelations.every(({ better, worse }) => {
    /**
     * Si el peor tercero entra, el mejor tercero también debería entrar.
     * Ejemplo:
     * - 3B ya está bloqueado por encima de 3I
     * - una combinación contiene I pero no B
     * - esa combinación ya es imposible
     */
    if (qualifiedGroups.has(worse) && !qualifiedGroups.has(better)) {
      return false;
    }

    return true;
  });
}

function getGuaranteedGroups(possibleOptions) {
  if (!possibleOptions.length) return [];

  return WORLD_CUP_GROUPS.filter((group) =>
    possibleOptions.every((option) => option.qualifiedGroups.includes(group))
  );
}

function getEliminatedGroups(possibleOptions) {
  if (!possibleOptions.length) return WORLD_CUP_GROUPS;

  return WORLD_CUP_GROUPS.filter((group) =>
    possibleOptions.every((option) => !option.qualifiedGroups.includes(group))
  );
}

function getOpenGroups({ guaranteedGroups, eliminatedGroups }) {
  const guaranteed = new Set(guaranteedGroups);
  const eliminated = new Set(eliminatedGroups);

  return WORLD_CUP_GROUPS.filter(
    (group) => !guaranteed.has(group) && !eliminated.has(group)
  );
}

function buildMatchupProbabilities(possibleOptions) {
  const total = possibleOptions.length;

  return THIRD_PLACE_COLUMNS.reduce((acc, column) => {
    const countsByGroup = {};

    possibleOptions.forEach((option) => {
      const assignedSlot = option.assignment[column];
      const group = normalizeGroup(assignedSlot);

      if (!group) return;

      countsByGroup[group] = (countsByGroup[group] || 0) + 1;
    });

    const options = Object.entries(countsByGroup)
      .map(([group, count]) => ({
        column,
        group,
        assignedSlot: `3${group}`,
        count,
        percentage: total > 0 ? Math.round((count / total) * 10000) / 100 : 0,
      }))
      .sort((a, b) => {
        if (b.percentage !== a.percentage) {
          return b.percentage - a.percentage;
        }

        return a.group.localeCompare(b.group, "es");
      });

    acc[column] = {
      column,
      total,
      options,
      resolvedGroup:
        options.length === 1 && options[0].percentage === 100
          ? options[0].group
          : null,
      resolvedSlot:
        options.length === 1 && options[0].percentage === 100
          ? options[0].assignedSlot
          : null,
    };

    return acc;
  }, {});
}

function buildResolvedThirdSlotsByColumn({
  matchupProbabilities,
  bestThirdsTable = [],
}) {
  const rowsByGroup = getThirdRowsByGroup(bestThirdsTable);

  return Object.fromEntries(
    THIRD_PLACE_COLUMNS.map((column) => {
      const probability = matchupProbabilities[column];
      const group = probability?.resolvedGroup;
      const row = group ? rowsByGroup[group] : null;

      return [
        column,
        group && row
          ? {
              column,
              group,
              assignedSlot: `3${group}`,
              team: row.team,
              row,
              source: row.isGroupOfficiallyClosed ? "official" : "projected",
            }
          : null,
      ];
    })
  );
}

export function buildThirdPlacePossibilities({
  matches = [],
  sandboxResults = {},
  bestThirdsTable = [],
} = {}) {
  const matrixOptions = parseMatrixOptions();

  const effectivelyClosedGroups = getEffectivelyClosedGroups({
    matches,
    sandboxResults,
  });

  const knownRelations = buildKnownRelations({
    matches,
    sandboxResults,
    bestThirdsTable,
    effectivelyClosedGroups,
  });

  const possibleOptions = matrixOptions.filter((option) =>
    isOptionPossible(option, knownRelations)
  );

  const impossibleOptions = matrixOptions.filter(
    (option) => !isOptionPossible(option, knownRelations)
  );

  const guaranteedGroups = getGuaranteedGroups(possibleOptions);
  const eliminatedGroups = getEliminatedGroups(possibleOptions);
  const openGroups = getOpenGroups({
    guaranteedGroups,
    eliminatedGroups,
  });

  const matchupProbabilities = buildMatchupProbabilities(possibleOptions);

  const resolvedThirdSlotsByColumn = buildResolvedThirdSlotsByColumn({
    matchupProbabilities,
    bestThirdsTable,
  });

  return {
    totalOptions: matrixOptions.length,
    possibleCount: possibleOptions.length,
    impossibleCount: impossibleOptions.length,

    possibleOptions,
    impossibleOptions,

    effectivelyClosedGroups: Array.from(effectivelyClosedGroups),
    knownRelations,

    guaranteedGroups,
    eliminatedGroups,
    openGroups,

    matchupProbabilities,
    resolvedThirdSlotsByColumn,
  };
}