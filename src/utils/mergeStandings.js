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

  return Array.from(map.values())
    .sort((a, b) => b.points - a.points)
    .map((row, i) => ({
      ...row,
      position: i + 1,
    }));
};