import { KNOCKOUT_ROUNDS } from "./knockoutStructure";
import { resolveThirdPlaceSlot } from "./resolveThirdPlaceSlots";
import {
  getGroupMatches,
  hasMinimumGroupSignal,
  isGroupOfficiallyClosed,
  isOfficialResult,
} from "./matchResultUtils";

function normalizeMatchCode(value) {
  const raw = String(value ?? "").trim().toUpperCase();

  if (!raw) return "";

  const directMatch = raw.match(/^M?(7[3-9]|8[0-9]|9[0-9]|10[0-4])$/);

  if (!directMatch) return "";

  return `M${directMatch[1]}`;
}

function buildOfficialMatchesByCode(matches = []) {
  return matches.reduce((acc, match) => {
    const matchCode = normalizeMatchCode(match?.matchCode);

    if (!matchCode) return acc;

    acc[matchCode] = match;

    return acc;
  }, {});
}

function getOfficialMatchForBracketMatch(match, officialMatchesByCode) {
  const matchCode = normalizeMatchCode(match?.matchId);

  if (!matchCode) return null;

  return officialMatchesByCode[matchCode] ?? null;
}

function getValidWinnerSide(value) {
  return value === "home" || value === "away" ? value : null;
}

function getOfficialWinnerSide(officialMatch) {
  if (!isOfficialResult(officialMatch)) return null;

  const explicitWinnerSide = getValidWinnerSide(officialMatch.winnerSide);

  if (explicitWinnerSide) return explicitWinnerSide;

  const homeGoals = Number(officialMatch.result.homeGoals);
  const awayGoals = Number(officialMatch.result.awayGoals);

  if (homeGoals > awayGoals) return "home";
  if (awayGoals > homeGoals) return "away";

  return null;
}

function getOfficialLoserSide(officialMatch) {
  const winnerSide = getOfficialWinnerSide(officialMatch);

  if (winnerSide === "home") return "away";
  if (winnerSide === "away") return "home";

  return null;
}

function getWinnerSide(match, knockoutPicks) {
  return (
    getOfficialWinnerSide(match.officialMatch) ??
    knockoutPicks?.[match.matchId] ??
    null
  );
}

function getLoserSide(match, knockoutPicks) {
  const officialLoserSide = getOfficialLoserSide(match.officialMatch);

  if (officialLoserSide) return officialLoserSide;

  const selectedSide = knockoutPicks?.[match.matchId];

  if (selectedSide === "home") return "away";
  if (selectedSide === "away") return "home";

  return null;
}

function markSlotAsOfficialKnockoutResult(slot) {
  if (!slot) return null;

  return {
    ...slot,
    source: "official-knockout-result",
    isResolved: true,
    isOfficial: true,
  };
}

function markSlotAsKnockoutPick(slot) {
  if (!slot) return null;

  return {
    ...slot,
    source: "knockout-pick",
    isResolved: true,
    isOfficial: false,
  };
}

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
    source: pickedSlot.source ?? "knockout-pick",
    isResolved: true,
    isOfficial: Boolean(pickedSlot.isOfficial),
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
    source: pickedSlot.source ?? "knockout-pick",
    isResolved: true,
    isOfficial: Boolean(pickedSlot.isOfficial),
  };
}

function resolveSlot({
  slot,
  matches,
  groupTablesByGroup,
  bestThirdsTable,
  sandboxResults,
  resolvedSlots,
  thirdPlacePossibilities,
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
      thirdPlacePossibilities,
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
  const selectedSide = getWinnerSide(match, knockoutPicks);

  if (selectedSide === "home" && match.home?.team) {
    return getOfficialWinnerSide(match.officialMatch)
      ? markSlotAsOfficialKnockoutResult(match.home)
      : markSlotAsKnockoutPick(match.home);
  }

  if (selectedSide === "away" && match.away?.team) {
    return getOfficialWinnerSide(match.officialMatch)
      ? markSlotAsOfficialKnockoutResult(match.away)
      : markSlotAsKnockoutPick(match.away);
  }

  return null;
}

function getSelectedLoserSlot(match, knockoutPicks) {
  const loserSide = getLoserSide(match, knockoutPicks);

  if (loserSide === "home" && match.home?.team) {
    return getOfficialLoserSide(match.officialMatch)
      ? markSlotAsOfficialKnockoutResult(match.home)
      : markSlotAsKnockoutPick(match.home);
  }

  if (loserSide === "away" && match.away?.team) {
    return getOfficialLoserSide(match.officialMatch)
      ? markSlotAsOfficialKnockoutResult(match.away)
      : markSlotAsKnockoutPick(match.away);
  }

  return null;
}

function buildKnockoutMatch({
  match,
  matches,
  officialMatchesByCode,
  groupTablesByGroup,
  bestThirdsTable,
  sandboxResults,
  knockoutPicks,
  resolvedSlots,
  thirdPlacePossibilities,
}) {
  const officialMatch = getOfficialMatchForBracketMatch(
    match,
    officialMatchesByCode
  );

  const builtMatch = {
    ...match,

    officialMatch,
    startTime: officialMatch?.startTime ?? match.startTime ?? null,
    lockTime: officialMatch?.lockTime ?? match.lockTime ?? null,
    status: officialMatch?.status ?? match.status ?? null,
    result: officialMatch?.result ?? match.result ?? null,
    channel: officialMatch?.channel ?? match.channel ?? null,

    home: resolveSlot({
      slot: match.homeSlot,
      matches,
      groupTablesByGroup,
      bestThirdsTable,
      sandboxResults,
      resolvedSlots,
      thirdPlacePossibilities,
    }),
    away: resolveSlot({
      slot: match.awaySlot,
      matches,
      groupTablesByGroup,
      bestThirdsTable,
      sandboxResults,
      resolvedSlots,
      thirdPlacePossibilities,
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

  const officialWinnerSide = getOfficialWinnerSide(builtMatch.officialMatch);
  const selectedWinnerSide =
    officialWinnerSide ?? knockoutPicks?.[builtMatch.matchId] ?? null;

  return {
    ...builtMatch,
    selectedWinnerSide,
    officialWinnerSide,
    hasOfficialResult: Boolean(officialWinnerSide),
    canPickWinner: Boolean(
      !officialWinnerSide &&
      builtMatch.home.team &&
      builtMatch.away.team
    ),
  };
}

export function buildKnockoutBracket({
  matches,
  groupTablesByGroup,
  bestThirdsTable,
  sandboxResults,
  knockoutPicks,
  thirdPlacePossibilities,
}) {
  const resolvedSlots = {};
  const officialMatchesByCode = buildOfficialMatchesByCode(matches);

  return KNOCKOUT_ROUNDS.map((round) => ({
    ...round,
    matches: round.matches.map((match) =>
      buildKnockoutMatch({
        match,
        matches,
        officialMatchesByCode,
        groupTablesByGroup,
        bestThirdsTable,
        sandboxResults,
        knockoutPicks,
        resolvedSlots,
        thirdPlacePossibilities,
      })
    ),
  }));
}