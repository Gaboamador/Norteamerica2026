export const filterStandingsByGroup = (standings, members) => {
  return standings.filter((row) =>
    members.includes(row.uid)
  );
};