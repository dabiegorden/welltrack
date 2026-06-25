import ModelClient, { isUnexpected } from "@azure-rest/ai-inference";
import { AzureKeyCredential } from "@azure/core-auth";

// GitHub Models (Azure AI Inference) — free marketplace models.
// Configured via GITHUB_TOKEN in the environment.
const token = process.env.GITHUB_TOKEN;
const endpoint = "https://models.github.ai/inference";
const MODEL_NAME = "deepseek/DeepSeek-V3-0324";

const client = token
  ? ModelClient(endpoint, new AzureKeyCredential(token))
  : null;

export interface AIAssessmentAnalysis {
  summary: string;
  riskLevel: "low" | "moderate" | "high";
  recommendations: string[];
}

export interface AIGeneratedAssessment extends AIAssessmentAnalysis {
  totalScore: number;
  maxScore: number;
}

export interface AIGeneratedQuestion {
  text: string;
  category: "workload" | "support" | "wellbeing" | "environment";
  options: { label: string; points: number }[];
}

const VALID_CATEGORIES = [
  "workload",
  "support",
  "wellbeing",
  "environment",
];

const FALLBACK_OPTIONS = [
  { label: "Never", points: 1 },
  { label: "Sometimes", points: 2 },
  { label: "Often", points: 3 },
  { label: "Always", points: 4 },
];

/**
 * Generates a set of scored stress-assessment questions from a prompt.
 * Each question includes 4 scored answer options officers can choose from.
 */
export async function generateAssessmentQuestions(
  prompt: string,
  count: number
): Promise<AIGeneratedQuestion[] | null> {
  if (!client) return null;

  const safeCount = Math.max(1, Math.min(30, Math.round(count) || 5));

  try {
    const userPrompt = `Create exactly ${safeCount} stress-assessment questions for police officers based on this topic/prompt:
"""
${prompt.trim()}
"""

Each question must measure stress and have 4 answer options ordered from least to most stress, scored 1 to 4.
Categorize each question as one of: workload, support, wellbeing, environment.

Respond ONLY with a JSON object in this exact shape:
{
  "questions": [
    {
      "text": "the question",
      "category": "workload" | "support" | "wellbeing" | "environment",
      "options": [
        { "label": "Never", "points": 1 },
        { "label": "Sometimes", "points": 2 },
        { "label": "Often", "points": 3 },
        { "label": "Always", "points": 4 }
      ]
    }
  ]
}
Return exactly ${safeCount} questions.`;

    const content = await runChat(SYSTEM_PROMPT, userPrompt);
    if (!content) return null;
    const parsed = extractJson(content);
    const rawQuestions = Array.isArray(parsed.questions)
      ? parsed.questions
      : [];

    const questions: AIGeneratedQuestion[] = rawQuestions
      .filter((q: any) => q && typeof q.text === "string" && q.text.trim())
      .map((q: any) => {
        const options =
          Array.isArray(q.options) && q.options.length
            ? q.options
                .filter((o: any) => o && o.label)
                .map((o: any) => ({
                  label: String(o.label),
                  points: Number(o.points) || 0,
                }))
            : FALLBACK_OPTIONS;
        return {
          text: String(q.text).trim(),
          category: VALID_CATEGORIES.includes(q.category)
            ? q.category
            : "wellbeing",
          options,
        };
      });

    return questions.length ? questions : null;
  } catch (error) {
    console.error("[github-ai] generateAssessmentQuestions error:", error);
    return null;
  }
}

function extractJson(text: string): any {
  const cleaned = text.replace(/```json|```/g, "").trim();
  // Be forgiving: pull the first {...} block if extra prose surrounds it
  const match = cleaned.match(/\{[\s\S]*\}/);
  return JSON.parse(match ? match[0] : cleaned);
}

async function runChat(
  systemPrompt: string,
  userPrompt: string
): Promise<string | null> {
  if (!client) return null;
  const response = await client.path("/chat/completions").post({
    body: {
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      top_p: 0.9,
      max_tokens: 2048,
      model: MODEL_NAME,
    },
  });

  if (isUnexpected(response)) {
    throw response.body.error;
  }

  return response.body.choices?.[0]?.message?.content ?? null;
}

const SYSTEM_PROMPT =
  "You are a wellness assistant supporting a police department's officer wellness program. You always respond with valid JSON only, no markdown fences or extra prose.";

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
  if (!client) return null;

  try {
    const responseLines = input.responses
      .map((r) => `- ${r.questionText} (score: ${r.score}/4)`)
      .join("\n");

    const prompt = `Analyze the following stress assessment submitted by an officer and produce a confidential summary for the wellness counselor reviewing it.

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

    const content = await runChat(SYSTEM_PROMPT, prompt);
    if (!content) return null;
    const parsed = extractJson(content);

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
    console.error("[github-ai] generateAssessmentAnalysis error:", error);
    return null;
  }
}

/**
 * Generates a full stress assessment (score, level, summary, recommendations)
 * from a free-text description.
 */
export async function generateAssessmentFromText(
  description: string
): Promise<AIGeneratedAssessment | null> {
  if (!client) return null;

  try {
    const prompt = `An officer's situation has been described below. Based on this description, assess their current stress level.

Description:
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

    const content = await runChat(SYSTEM_PROMPT, prompt);
    if (!content) return null;
    const parsed = extractJson(content);

    const totalScore = Math.max(
      0,
      Math.min(40, Math.round(Number(parsed.totalScore) || 0))
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
    console.error("[github-ai] generateAssessmentFromText error:", error);
    return null;
  }
}
