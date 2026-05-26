// export const mergeStandings = (groupTables) => {
//   const map = new Map();

//   for (const table of groupTables) {
//     for (const row of table) {
//       if (!map.has(row.uid)) {
//         map.set(row.uid, { ...row });
//       }
//       // 🚫 NO sumar puntos
//     }
//   }

//   return Array.from(map.values())
//     .sort((a, b) => b.points - a.points)
//     .map((row, i) => ({
//       ...row,
//       position: i + 1,
//     }));
// };
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

export const mergeStandings = (groupTables) => {
  const map = new Map();

  for (const table of groupTables) {
    for (const row of table) {
      if (!map.has(row.uid)) {
        map.set(row.uid, { ...row });
      }
      // 🚫 NO sumar puntos
    }
  }

  const sorted = Array.from(map.values()).sort(compareStandingsRows);

  let previousRow = null;
  let previousPosition = 0;

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