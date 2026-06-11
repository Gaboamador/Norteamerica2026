import { getThirdPlaceAssignment } from "./thirdPlaceMatrix";
import {
  WORLD_CUP_GROUPS,
  getGroupMatches,
  hasMinimumGroupSignal,
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

function buildThirdPlaceholderSlot(slot, source = "third-placeholder") {
  return {
    label: slot.label,
    displayName: slot.label,
    team: null,
    group: null,
    candidateGroups: slot.candidateGroups,
    source,
    isResolved: false,
    isOfficial: false,
  };
}

export function resolveThirdPlaceSlot({
  slot,
  matches,
  groupTablesByGroup,
  bestThirdsTable,
  sandboxResults,
}) {
  const allGroupsEffectivelyClosed = areAllGroupsEffectivelyClosed({
    matches,
    sandboxResults,
  });

  if (!allGroupsEffectivelyClosed) {
    return buildThirdPlaceholderSlot(slot, "third-groups-incomplete");
  }

  if (!hasAllEightQualifiedThirds(bestThirdsTable)) {
    return buildThirdPlaceholderSlot(slot, "third-placeholder");
  }

  const qualifiedThirdGroups = getQualifiedThirdGroups(bestThirdsTable);
  const assignment = getThirdPlaceAssignment(qualifiedThirdGroups);

  if (!assignment) {
    return buildThirdPlaceholderSlot(slot, "third-matrix-missing");
  }

  const assignedSlot = assignment[slot.matrixColumn];

  if (!assignedSlot) {
    return buildThirdPlaceholderSlot(slot, "third-column-missing");
  }

  const assignedGroup = assignedSlot.replace("3", "");
  const row = getThirdRowByGroup(bestThirdsTable, assignedGroup);

  if (!row) {
    return {
      label: assignedSlot,
      displayName: assignedSlot,
      team: null,
      group: assignedGroup,
      source: "third-row-missing",
      isResolved: false,
      isOfficial: false,
    };
  }

  const groupMatches = getGroupMatches(matches, assignedGroup);
  const hasSignal = hasMinimumGroupSignal(groupMatches, sandboxResults);
  const isOfficial = isGroupOfficiallyClosed(groupMatches);

  if (!hasSignal) {
    return {
      label: assignedSlot,
      displayName: assignedSlot,
      team: null,
      group: assignedGroup,
      source: "placeholder",
      isResolved: false,
      isOfficial: false,
      row,
    };
  }

  return {
    label: assignedSlot,
    displayName: row.team,
    team: row.team,
    group: assignedGroup,
    source: isOfficial ? "official" : "projected",
    isResolved: true,
    isOfficial,
    row,
  };
}