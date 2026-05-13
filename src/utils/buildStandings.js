import { calculatePoints } from "@/utils/scoring";

// ------------ FUNCIONES HELPER ------------ //
const getWinner = (homeGoals, awayGoals) => {
  if (homeGoals > awayGoals) return "home";
  if (awayGoals > homeGoals) return "away";
  return "draw";
};

const getTieBreakStats = (prediction, result, points) => {
  const predHome = Number(prediction.predHome);
  const predAway = Number(prediction.predAway);

  const realHome = Number(result.homeGoals);
  const realAway = Number(result.awayGoals);

  const predictedWinner = getWinner(predHome, predAway);
  const realWinner = getWinner(realHome, realAway);

  const isSignHit = predictedWinner === realWinner;
  const isScoredMatch = points > 0;
  const isPleno = predHome === realHome && predAway === realAway;

  return {
    signHits: isSignHit ? 1 : 0,
    scoredMatches: isScoredMatch ? 1 : 0,
    plenos: isPleno ? 1 : 0,
  };
};

const compareStandingsRows = (a, b) => {
  if (b.points !== a.points) return b.points - a.points;
  if (b.signHits !== a.signHits) return b.signHits - a.signHits;
  if (b.scoredMatches !== a.scoredMatches) {
    return b.scoredMatches - a.scoredMatches;
  }
  if (b.plenos !== a.plenos) return b.plenos - a.plenos;

  // Sólo para estabilidad visual. No debería usarse para desempatar posición.
  const nameCompare = (a.displayName || "").localeCompare(
    b.displayName || "",
    "es",
    { sensitivity: "base" }
  );

  if (nameCompare !== 0) return nameCompare;

  return (a.uid || "").localeCompare(b.uid || "");
};

const hasSameCompetitiveRank = (a, b) => {
  return (
    a.points === b.points &&
    a.signHits === b.signHits &&
    a.scoredMatches === b.scoredMatches &&
    a.plenos === b.plenos
  );
};
// ------------ FUNCIONES HELPER ------------ //


export const buildStandings = (predictions, matches, usersMap = {}, memberIds = []) => {
  const table = {};
  const matchesMap = new Map(matches.map((m) => [m.id, m]));

  // inicializar todos los miembros con 0 puntos
  memberIds.forEach((uid) => {
    const currentUser = usersMap[uid];

    table[uid] = {
      uid,
      displayName:
        currentUser?.displayName ||
        currentUser?.email ||
        "Usuario",
      email: currentUser?.email || "",
      points: 0,
      signHits: 0,
      scoredMatches: 0,
      plenos: 0,
    };
  });

  predictions.forEach((p) => {
    const match = matchesMap.get(p.matchId);

    const points = match?.result
      ? calculatePoints(p, match.result)
      : 0;

    if (!table[p.uid]) {
      const currentUser = usersMap[p.uid];

      table[p.uid] = {
        uid: p.uid,
        displayName:
          currentUser?.displayName ||
          p.displayName ||
          currentUser?.email ||
          "Usuario",
        email: currentUser?.email || p.email || "",
        points: 0,
        signHits: 0,
        scoredMatches: 0,
        plenos: 0,
      };
    }

    table[p.uid].points += points;

    if (match?.result) {
      const stats = getTieBreakStats(p, match.result, points);

      table[p.uid].signHits += stats.signHits;
      table[p.uid].scoredMatches += stats.scoredMatches;
      table[p.uid].plenos += stats.plenos;
    }

  });
  
  const sorted = Object.values(table).sort(
    (a, b) => b.points - a.points
  );

  let previousRow = null;
  let previousPosition = 0;

  // return sorted.map((row, index) => ({
  //   ...row,
  //   position: index + 1,
  // }));
  return sorted.map((row, index) => {
    const position =
      previousRow && hasSameCompetitiveRank(row, previousRow)
        ? previousPosition
        : index + 1;

    previousRow = row;
    previousPosition = position;

    return {
      ...row,
      position,
    };
  });
};