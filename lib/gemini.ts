import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;
const MODEL_NAME = "gemini-3.5-flash";

export interface AIAssessmentAnalysis {
  summary: string;
  riskLevel: "low" | "moderate" | "high";
  recommendations: string[];
}

export interface AIGeneratedAssessment extends AIAssessmentAnalysis {
  totalScore: number;
  maxScore: number;
}

function extractJson(text: string): any {
  const cleaned = text.replace(/```json|```/g, "").trim();
  return JSON.parse(cleaned);
}

/**
 * Analyzes a completed Likert-scale assessment and produces a written
 * summary and recommendations for counselors/admins.
 */
export async function generateAssessmentAnalysis(input: {
  templateName: string;
  responses: { questionText: string; score: number }[];
  totalScore: number;
  maxScore: number;
  stressLevel: "low" | "moderate" | "high";
  notes?: string;
}): Promise<AIAssessmentAnalysis | null> {
  if (!genAI) return null;

  try {
    const model = genAI.getGenerativeModel({
      model: MODEL_NAME,
      generationConfig: { responseMimeType: "application/json" },
    });

    const responseLines = input.responses
      .map((r) => `- ${r.questionText} (score: ${r.score}/4)`)
      .join("\n");

    const prompt = `You are a wellness assistant supporting a police department's officer wellness program. Analyze the following stress assessment submitted by an officer and produce a confidential summary for the wellness counselor reviewing it.

Assessment: ${input.templateName}
Total score: ${input.totalScore}/${input.maxScore}
Calculated stress level: ${input.stressLevel}

Question responses (0 = Not at all, 4 = Severely):
${responseLines}

Officer's additional notes: ${input.notes?.trim() || "None provided"}

Respond ONLY with a JSON object in this exact shape:
{
  "summary": "2-4 sentence summary of the officer's wellbeing and key stressors, written for a counselor",
  "riskLevel": "low" | "moderate" | "high",
  "recommendations": ["short actionable recommendation", "..."]
}
Provide 3-5 recommendations.`;

    const result = await model.generateContent(prompt);
    const parsed = extractJson(result.response.text());

    return {
      summary: String(parsed.summary || ""),
      riskLevel: ["low", "moderate", "high"].includes(parsed.riskLevel)
        ? parsed.riskLevel
        : input.stressLevel,
      recommendations: Array.isArray(parsed.recommendations)
        ? parsed.recommendations.map(String)
        : [],
    };
  } catch (error) {
    console.error("[gemini] generateAssessmentAnalysis error:", error);
    return null;
  }
}

/**
 * Generates a full stress assessment (score, level, summary, recommendations)
 * from a free-text description provided by an officer.
 */
export async function generateAssessmentFromText(
  description: string,
): Promise<AIGeneratedAssessment | null> {
  if (!genAI) return null;

  try {
    const model = genAI.getGenerativeModel({
      model: MODEL_NAME,
      generationConfig: { responseMimeType: "application/json" },
    });

    const prompt = `You are a wellness assistant supporting a police department's officer wellness program. An officer has described how they are feeling in their own words. Based on this description, assess their current stress level.

Officer's description:
"""
${description.trim()}
"""

Respond ONLY with a JSON object in this exact shape:
{
  "totalScore": <integer 0-40 representing overall stress severity, where 0 is no stress and 40 is extreme stress>,
  "maxScore": 40,
  "riskLevel": "low" | "moderate" | "high",
  "summary": "2-4 sentence summary of the officer's wellbeing and key stressors, written for a counselor",
  "recommendations": ["short actionable recommendation", "..."]
}
Provide 3-5 recommendations.`;

    const result = await model.generateContent(prompt);
    const parsed = extractJson(result.response.text());

    const totalScore = Math.max(
      0,
      Math.min(40, Math.round(Number(parsed.totalScore) || 0)),
    );

    return {
      totalScore,
      maxScore: 40,
      summary: String(parsed.summary || ""),
      riskLevel: ["low", "moderate", "high"].includes(parsed.riskLevel)
        ? parsed.riskLevel
        : "moderate",
      recommendations: Array.isArray(parsed.recommendations)
        ? parsed.recommendations.map(String)
        : [],
    };
  } catch (error) {
    console.error("[gemini] generateAssessmentFromText error:", error);
    return null;
  }
}
