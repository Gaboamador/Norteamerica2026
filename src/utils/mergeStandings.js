export const mergeStandings = (groupTables) => {
  const map = new Map();

  for (const table of groupTables) {
    for (const row of table) {
      const existing = map.get(row.uid);

      if (!existing) {
        map.set(row.uid, { ...row });
      } else {
        existing.points += row.points;
      }
    }
  }

  return Array.from(map.values())
    .sort((a, b) => b.points - a.points)
    .map((row, i) => ({
      ...row,
      position: i + 1,
    }));
};