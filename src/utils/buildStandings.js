import { calculatePoints } from "@/utils/scoring";

export const buildStandings = (predictions, matches) => {
  const table = {};
  const matchesMap = new Map(matches.map((m) => [m.id, m]));

  predictions.forEach((p) => {
    const match = matchesMap.get(p.matchId);

    const points = match?.result
      ? calculatePoints(p, match.result)
      : 0;

    if (!table[p.uid]) {
      table[p.uid] = {
        uid: p.uid,
        displayName: p.displayName || p.uid,
        points: 0,
      };
    }

    table[p.uid].points += points;
  });

  const sorted = Object.values(table).sort(
    (a, b) => b.points - a.points
  );

  return sorted.map((row, index) => ({
    ...row,
    position: index + 1,
  }));
};