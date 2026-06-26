import { getThirdPlaceAssignment } from "./thirdPlaceMatrix";
import {
  WORLD_CUP_GROUPS,
  getGroupMatches,
  isGroupEffectivelyClosed,
  isGroupOfficiallyClosed,
} from "./matchResultUtils";

function getQualifiedThirdGroups(bestThirdsTable) {
  return bestThirdsTable
    .filter((row) => row.bestThirdStatus === "qualified")
    .map((row) => row.group);
}

function getThirdRowByGroup(bestThirdsTable, group) {
  return bestThirdsTable.find(
    (row) => row.group === group && row.bestThirdStatus === "qualified"
  );
}

function getAnyThirdRowByGroup(bestThirdsTable, group) {
  return bestThirdsTable.find((row) => row.group === group);
}

function hasAllEightQualifiedThirds(bestThirdsTable) {
  return (
    bestThirdsTable.filter((row) => row.bestThirdStatus === "qualified")
      .length === 8
  );
}

function areAllGroupsEffectivelyClosed({ matches, sandboxResults }) {
  return WORLD_CUP_GROUPS.every((group) => {
    const groupMatches = getGroupMatches(matches, group);

    return isGroupEffectivelyClosed(groupMatches, sandboxResults);
  });
}

function getTopThirdOptionForSlot({
  slot,
  thirdPlacePossibilities,
  bestThirdsTable,
}) {
  const options =
    thirdPlacePossibilities?.matchupProbabilities?.[slot.matrixColumn]?.options;

  if (!Array.isArray(options) || options.length === 0) return null;

  const topOption = options[0];

  if (!topOption?.group) return null;

  const row = getAnyThirdRowByGroup(bestThirdsTable, topOption.group);

  return {
    group: topOption.group,
    assignedSlot: topOption.assignedSlot ?? `3${topOption.group}`,
    percentage: topOption.percentage,
    team: row?.team ?? null,
  };
}

function buildThirdPlaceholderSlot(
  slot,
  source = "third-placeholder",
  thirdPlacePossibilities = null,
  bestThirdsTable = []
) {
  return {
    label: slot.label,
    displayName: slot.label,
    team: null,
    group: null,
    candidateGroups: slot.candidateGroups,
    source,
    isResolved: false,
    isOfficial: false,
    matrixColumn: slot.matrixColumn,
    topThirdOption: getTopThirdOptionForSlot({
      slot,
      thirdPlacePossibilities,
      bestThirdsTable,
    }),
  };
}

function buildResolvedThirdSlotFromPossibilities({
  slot,
  bestThirdsTable,
  thirdPlacePossibilities,
}) {
  const resolvedThirdSlot =
    thirdPlacePossibilities?.resolvedThirdSlotsByColumn?.[slot.matrixColumn];

  if (!resolvedThirdSlot?.group || !resolvedThirdSlot?.team) {
    return null;
  }

  const row =
    resolvedThirdSlot.row ??
    getAnyThirdRowByGroup(bestThirdsTable, resolvedThirdSlot.group);

  if (!row) return null;

  const assignedSlot =
    resolvedThirdSlot.assignedSlot ?? `3${resolvedThirdSlot.group}`;

  return {
    label: assignedSlot,
    displayName: row.team,
    team: row.team,
    group: resolvedThirdSlot.group,
    candidateGroups: slot.candidateGroups,
    source: row.isGroupOfficiallyClosed ? "official" : "projected",
    isResolved: true,
    isOfficial: Boolean(row.isGroupOfficiallyClosed),
    row,
    matrixColumn: slot.matrixColumn,
    resolvedByPossibilities: true,
  };
}

export function resolveThirdPlaceSlot({
  slot,
  matches,
  groupTablesByGroup,
  bestThirdsTable,
  sandboxResults,
  thirdPlacePossibilities,
}) {
  /**
   * Regla nueva:
   * si el análisis de combinaciones ya determinó que esta columna
   * de matriz tiene un único grupo posible al 100%, resolvemos el slot
   * aunque todavía no estén cerrados todos los grupos.
   */
  const resolvedByPossibilities = buildResolvedThirdSlotFromPossibilities({
    slot,
    bestThirdsTable,
    thirdPlacePossibilities,
  });

  if (resolvedByPossibilities) {
    return resolvedByPossibilities;
  }

  /**
   * Regla histórica:
   * si todavía no hay una definición parcial al 100%, mantenemos el
   * comportamiento anterior y no cargamos terceros hasta que todos los grupos
   * estén efectivamente cerrados.
   */
  const allGroupsEffectivelyClosed = areAllGroupsEffectivelyClosed({
    matches,
    sandboxResults,
  });

  if (!allGroupsEffectivelyClosed) {
    return buildThirdPlaceholderSlot(slot, "third-groups-incomplete", thirdPlacePossibilities, bestThirdsTable);
  }

  if (!hasAllEightQualifiedThirds(bestThirdsTable)) {
    return buildThirdPlaceholderSlot(slot, "third-placeholder", thirdPlacePossibilities, bestThirdsTable);
  }

  const qualifiedThirdGroups = getQualifiedThirdGroups(bestThirdsTable);
  const assignment = getThirdPlaceAssignment(qualifiedThirdGroups);

  if (!assignment) {
    return buildThirdPlaceholderSlot(slot, "third-matrix-missing", thirdPlacePossibilities, bestThirdsTable);
  }

  const assignedSlot = assignment[slot.matrixColumn];

  if (!assignedSlot) {
    return buildThirdPlaceholderSlot(slot, "third-column-missing", thirdPlacePossibilities, bestThirdsTable);
  }

  const assignedGroup = assignedSlot.replace("3", "");
  const row = getThirdRowByGroup(bestThirdsTable, assignedGroup);

  if (!row) {
    return {
      label: assignedSlot,
      displayName: assignedSlot,
      team: null,
      group: assignedGroup,
      candidateGroups: slot.candidateGroups,
      source: "third-row-missing",
      isResolved: false,
      isOfficial: false,
      matrixColumn: slot.matrixColumn,
    };
  }

  const groupMatches = getGroupMatches(matches, assignedGroup);
  const isOfficial = isGroupOfficiallyClosed(groupMatches);

  return {
    label: assignedSlot,
    displayName: row.team,
    team: row.team,
    group: assignedGroup,
    candidateGroups: slot.candidateGroups,
    source: isOfficial ? "official" : "projected",
    isResolved: true,
    isOfficial,
    row,
    matrixColumn: slot.matrixColumn,
  };
}