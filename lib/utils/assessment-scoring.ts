// Stress Assessment Scoring Logic
// Maximum score: 25 (5 questions × 4 points each + buffer for scaling)
// Scaled to 100 for consistency

export interface ScoringResult {
  totalScore: number;
  stressLevel: "low" | "moderate" | "high";
  percentage: number;
}

export function calculateStressScore(responses: number[]): ScoringResult {
  // responses: array of Likert scale scores (0-4 each)
  const rawScore = responses.reduce((sum, score) => sum + score, 0);

  // Scale to 0-100 based on max possible score
  const maxPossibleScore = responses.length * 4;
  const totalScore = Math.round((rawScore / maxPossibleScore) * 100);

  // Classify stress level
  let stressLevel: "low" | "moderate" | "high";
  if (totalScore <= 33) {
    stressLevel = "low";
  } else if (totalScore <= 66) {
    stressLevel = "moderate";
  } else {
    stressLevel = "high";
  }

  return {
    totalScore,
    stressLevel,
    percentage: totalScore,
  };
}

export function getStressLevelDescription(
  level: "low" | "moderate" | "high"
): string {
  const descriptions = {
    low: "Your stress levels are within healthy ranges. Continue with your current wellness practices.",
    moderate:
      "Your stress levels are moderate. Consider engaging with our wellness resources and peer support forums.",
    high: "Your stress levels are elevated. We recommend scheduling a counseling session with our professionals.",
  };
  return descriptions[level];
}

export function getStressLevelColor(
  level: "low" | "moderate" | "high"
): string {
  const colors = {
    low: "text-green-600 dark:text-green-400",
    moderate: "text-yellow-600 dark:text-yellow-400",
    high: "text-red-600 dark:text-red-400",
  };
  return colors[level];
}
