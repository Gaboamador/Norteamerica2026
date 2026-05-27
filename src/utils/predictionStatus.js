import { isMatchLocked } from "@/services/firebase/firebaseUtils";
import { getTeamFlagCode } from "@/utils/flagUtils";

export function isMatchPredictable(match) {
  const hasHomeTeam = Boolean(getTeamFlagCode(match.homeTeam));
  const hasAwayTeam = Boolean(getTeamFlagCode(match.awayTeam));

  return hasHomeTeam && hasAwayTeam && !isMatchLocked(match);
}

export function needsPrediction(match, prediction) {
  return isMatchPredictable(match) && !prediction;
}

export function countMissingPredictions(matches, predictions) {
  const predictedMatchIds = new Set(
    predictions.map((prediction) => prediction.matchId)
  );

  return matches.filter((match) => {
    const hasPrediction = predictedMatchIds.has(match.id);

    return isMatchPredictable(match) && !hasPrediction;
  }).length;
}