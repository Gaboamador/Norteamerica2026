export const WORLD_CUP_GROUPS = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
];

export function isValidGoalValue(value) {
  if (value === "" || value === null || value === undefined) return false;

  const numberValue = Number(value);

  return Number.isInteger(numberValue) && numberValue >= 0;
}

export function hasCompleteResult(result) {
  return (
    result &&
    isValidGoalValue(result.homeGoals) &&
    isValidGoalValue(result.awayGoals)
  );
}

export function isOfficialResult(match) {
  return hasCompleteResult(match?.result);
}

export function getEffectiveResult(match, sandboxResults) {
  if (isOfficialResult(match)) {
    return {
      homeGoals: Number(match.result.homeGoals),
      awayGoals: Number(match.result.awayGoals),
      source: "official",
    };
  }

  const sandboxResult = sandboxResults?.[match.id];

  if (!hasCompleteResult(sandboxResult)) {
    return null;
  }

  return {
    homeGoals: Number(sandboxResult.homeGoals),
    awayGoals: Number(sandboxResult.awayGoals),
    source: "sandbox",
  };
}

export function getGroupMatches(matches, group) {
  return matches
    .filter((match) => match.group === group)
    .sort((a, b) => {
      const aTime = a.startTime?.toMillis?.() ?? 0;
      const bTime = b.startTime?.toMillis?.() ?? 0;

      return aTime - bTime;
    });
}

export function getAvailableGroups(matches) {
  const groupsWithMatches = new Set(
    matches
      .map((match) => match.group)
      .filter((group) => WORLD_CUP_GROUPS.includes(group))
  );

  return WORLD_CUP_GROUPS.filter((group) => groupsWithMatches.has(group));
}

export function getGroupTeams(groupMatches) {
  const teams = new Set();

  groupMatches.forEach((match) => {
    if (match.homeTeam) teams.add(match.homeTeam);
    if (match.awayTeam) teams.add(match.awayTeam);
  });

  return Array.from(teams);
}

export function isGroupOfficiallyClosed(groupMatches) {
  if (!groupMatches.length) return false;

  return groupMatches.every((match) => isOfficialResult(match));
}

export function isGroupEffectivelyClosed(groupMatches, sandboxResults) {
  return (
    groupMatches.length >= 6 &&
    groupMatches.every((match) => Boolean(getEffectiveResult(match, sandboxResults)))
  );
}

export function hasMinimumGroupSignal(groupMatches, sandboxResults) {
  const resolvedMatches = groupMatches.filter((match) =>
    getEffectiveResult(match, sandboxResults)
  );

  if (resolvedMatches.length < 2) return false;

  const teams = new Set();

  resolvedMatches.forEach((match) => {
    teams.add(match.homeTeam);
    teams.add(match.awayTeam);
  });

  return teams.size === 4;
}