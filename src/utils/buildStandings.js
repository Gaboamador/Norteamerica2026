export const buildStandings = (predictions) => {
  const table = {};

  predictions.forEach((p) => {
    if (!table[p.uid]) {
      table[p.uid] = {
        uid: p.uid,
        displayName: p.displayName || p.uid,
        points: 0,
      };
    }

    table[p.uid].points += p.points || 0;
  });

  // return Object.values(table).sort(
  //   (a, b) => b.points - a.points
  // );
  const sorted = Object.values(table).sort(
    (a, b) => b.points - a.points
  );

  return sorted.map((row, index) => ({
    ...row,
    position: index + 1,
  }));
};