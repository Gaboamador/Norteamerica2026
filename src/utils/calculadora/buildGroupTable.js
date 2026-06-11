import {
  getEffectiveResult,
  getGroupTeams,
  isGroupOfficiallyClosed,
} from "./matchResultUtils";
import { sortGroupRowsWithTiebreakers } from "./groupTiebreakers";

function createEmptyTeamRow(team, group) {
  return {
    team,
    group,
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDifference: 0,
    points: 0,

    unresolvedTiebreaker: false,
    unresolvedGroupId: null,
    manualTiebreakRank: null,

    rankingStatus: "automatic",
  };
}

function applyMatchToRows(rowsByTeam, match, result) {
  const home = rowsByTeam.get(match.homeTeam);
  const away = rowsByTeam.get(match.awayTeam);

  if (!home || !away || !result) return;

  const homeGoals = Number(result.homeGoals);
  const awayGoals = Number(result.awayGoals);

  home.played += 1;
  away.played += 1;

  home.goalsFor += homeGoals;
  home.goalsAgainst += awayGoals;

  away.goalsFor += awayGoals;
  away.goalsAgainst += homeGoals;

  if (homeGoals > awayGoals) {
    home.won += 1;
    home.points += 3;

    away.lost += 1;
  } else if (homeGoals < awayGoals) {
    away.won += 1;
    away.points += 3;

    home.lost += 1;
  } else {
    home.drawn += 1;
    away.drawn += 1;

    home.points += 1;
    away.points += 1;
  }
}

function finalizeRow(row) {
  return {
    ...row,
    goalDifference: row.goalsFor - row.goalsAgainst,
  };
}

export function buildGroupTable({
  group,
  groupMatches,
  sandboxResults,
  manualTiebreakers,
}) {
  const teams = getGroupTeams(groupMatches);

  const rowsByTeam = new Map(
    teams.map((team) => [team, createEmptyTeamRow(team, group)])
  );

  groupMatches.forEach((match) => {
    const result = getEffectiveResult(match, sandboxResults);

    if (!result) return;

    applyMatchToRows(rowsByTeam, match, result);
  });

  const rows = Array.from(rowsByTeam.values()).map(finalizeRow);

  const sortedRows = sortGroupRowsWithTiebreakers({
    group,
    rows,
    groupMatches,
    sandboxResults,
    manualTiebreakers,
  });

  return sortedRows.map((row, index) => ({
    ...row,
    position: index + 1,
    isGroupOfficiallyClosed: isGroupOfficiallyClosed(groupMatches),
  }));
}