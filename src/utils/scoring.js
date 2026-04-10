export const getWinner = (h, a) => {
  if (h > a) return "home";
  if (h < a) return "away";
  return "draw";
};

export const calculatePoints = (pred, result) => {
  const { predHome, predAway } = pred;
  const { homeGoals, awayGoals } = result;

  // pleno
  if (predHome === homeGoals && predAway === awayGoals) {
    return 8;
  }

  let points = 0;

  // ganador
  if (
    getWinner(predHome, predAway) ===
    getWinner(homeGoals, awayGoals)
  ) {
    points += 3;
  }

  // goles exactos
  if (predHome === homeGoals) points += 1;
  if (predAway === awayGoals) points += 1;

  return points;
};