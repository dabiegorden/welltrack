// Scoring logic for stress assessments
export function calculateStressLevel(
  totalScore: number,
  maxScore: number
): "low" | "moderate" | "high" {
  const percentage = (totalScore / maxScore) * 100;

  if (percentage <= 33) {
    return "low";
  } else if (percentage <= 66) {
    return "moderate";
  } else {
    return "high";
  }
}

export function getStressLevelColor(level: "low" | "moderate" | "high") {
  const colors = {
    low: "#10B981",
    moderate: "#F59E0B",
    high: "#EF4444",
  };
  return colors[level];
}
