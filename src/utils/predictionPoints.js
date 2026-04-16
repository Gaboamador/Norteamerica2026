import { calculatePoints } from "@/utils/scoring";

export const getPredictionPoints = (prediction, match) => {
  if (!prediction || !match?.result) return null;
  return calculatePoints(prediction, match.result);
};