import { KNOCKOUT_ROUNDS } from "./knockoutStructure";
import { resolveThirdPlaceSlot } from "./resolveThirdPlaceSlots";
import {
  getGroupMatches,
  hasMinimumGroupSignal,
  isGroupOfficiallyClosed,
} from "./matchResultUtils";

function resolveDirectSlot({
  slot,
  matches,
  groupTablesByGroup,
  sandboxResults,
}) {
  const groupMatches = getGroupMatches(matches, slot.group);
  const groupTable = groupTablesByGroup[slot.group] ?? [];
  const row = groupTable[slot.position - 1];

  const hasSignal = hasMinimumGroupSignal(groupMatches, sandboxResults);
  const isOfficial = isGroupOfficiallyClosed(groupMatches);

  if (!hasSignal || !row) {
    return {
      label: slot.label,
      displayName: slot.label,
      team: null,
      group: slot.group,
      source: "placeholder",
      isResolved: false,
      isOfficial: false,
    };
  }

  return {
    label: slot.label,
    displayName: row.team,
    team: row.team,
    group: slot.group,
    source: isOfficial ? "official" : "projected",
    isResolved: true,
    isOfficial,
    row,
  };
}

function buildPlaceholderSlot({ label, displayName, source }) {
  return {
    label,
    displayName,
    team: null,
    source,
    isResolved: false,
    isOfficial: false,
  };
}

function resolveWinnerSlot(slot, resolvedSlots) {
  const pickedSlot = resolvedSlots[slot.label];

  if (!pickedSlot) {
    return buildPlaceholderSlot({
      label: slot.label,
      displayName: `Ganador ${slot.label.replace("W", "M")}`,
      source: "winner-placeholder",
    });
  }

  return {
    ...pickedSlot,
    label: slot.label,
    source: "knockout-pick",
    isResolved: true,
    isOfficial: false,
  };
}

function resolveLoserSlot(slot, resolvedSlots) {
  const pickedSlot = resolvedSlots[slot.label];

  if (!pickedSlot) {
    return buildPlaceholderSlot({
      label: slot.label,
      displayName: `Perdedor ${slot.label.replace("L", "M")}`,
      source: "loser-placeholder",
    });
  }

  return {
    ...pickedSlot,
    label: slot.label,
    source: "knockout-pick",
    isResolved: true,
    isOfficial: false,
  };
}

function resolveSlot({
  slot,
  matches,
  groupTablesByGroup,
  bestThirdsTable,
  sandboxResults,
  resolvedSlots,
}) {
  if (slot.type === "direct") {
    return resolveDirectSlot({
      slot,
      matches,
      groupTablesByGroup,
      sandboxResults,
    });
  }

  if (slot.type === "thirdCandidate") {
    return resolveThirdPlaceSlot({
      slot,
      matches,
      groupTablesByGroup,
      bestThirdsTable,
      sandboxResults,
    });
  }

  if (slot.type === "winner") {
    return resolveWinnerSlot(slot, resolvedSlots);
  }

  if (slot.type === "loser") {
    return resolveLoserSlot(slot, resolvedSlots);
  }

  return buildPlaceholderSlot({
    label: slot.label ?? "Pendiente",
    displayName: slot.label ?? "Pendiente",
    source: "unknown",
  });
}

function getSelectedWinnerSlot(match, knockoutPicks) {
  const selectedSide = knockoutPicks?.[match.matchId];

  if (selectedSide === "home" && match.home?.team) {
    return match.home;
  }

  if (selectedSide === "away" && match.away?.team) {
    return match.away;
  }

  return null;
}

function getSelectedLoserSlot(match, knockoutPicks) {
  const selectedSide = knockoutPicks?.[match.matchId];

  if (selectedSide === "home" && match.away?.team) {
    return match.away;
  }

  if (selectedSide === "away" && match.home?.team) {
    return match.home;
  }

  return null;
}

function buildKnockoutMatch({
  match,
  matches,
  groupTablesByGroup,
  bestThirdsTable,
  sandboxResults,
  knockoutPicks,
  resolvedSlots,
}) {
  const builtMatch = {
    ...match,
    home: resolveSlot({
      slot: match.homeSlot,
      matches,
      groupTablesByGroup,
      bestThirdsTable,
      sandboxResults,
      resolvedSlots,
    }),
    away: resolveSlot({
      slot: match.awaySlot,
      matches,
      groupTablesByGroup,
      bestThirdsTable,
      sandboxResults,
      resolvedSlots,
    }),
  };

  const winner = getSelectedWinnerSlot(builtMatch, knockoutPicks);
  const loser = getSelectedLoserSlot(builtMatch, knockoutPicks);

  if (winner && builtMatch.winnerSlot) {
    resolvedSlots[builtMatch.winnerSlot] = winner;
  }

  if (loser && builtMatch.loserSlot) {
    resolvedSlots[builtMatch.loserSlot] = loser;
  }

  return {
    ...builtMatch,
    selectedWinnerSide: knockoutPicks?.[builtMatch.matchId] ?? null,
    canPickWinner: Boolean(builtMatch.home.team && builtMatch.away.team),
  };
}

export function buildKnockoutBracket({
  matches,
  groupTablesByGroup,
  bestThirdsTable,
  sandboxResults,
  knockoutPicks,
}) {
  const resolvedSlots = {};

  return KNOCKOUT_ROUNDS.map((round) => ({
    ...round,
    matches: round.matches.map((match) =>
      buildKnockoutMatch({
        match,
        matches,
        groupTablesByGroup,
        bestThirdsTable,
        sandboxResults,
        knockoutPicks,
        resolvedSlots,
      })
    ),
  }));
}