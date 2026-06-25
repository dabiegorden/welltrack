import { type NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { cookies } from "next/headers";
import { connectDB } from "@/lib/config/mongodb";
import AssessmentTemplate from "@/lib/models/AssessmentTemplate";
import { generateAssessmentQuestions } from "@/lib/gemini";
import { computeMaxScore } from "@/lib/utils/assessment-scoring";

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload || !["admin", "counselor"].includes(payload.role)) {
      return NextResponse.json(
        { error: "Only admins and counselors can generate assessments" },
        { status: 403 }
      );
    }

    const { name, prompt, count } = await request.json();
    if (!prompt || !prompt.trim()) {
      return NextResponse.json(
        { error: "Please provide a prompt describing the assessment" },
        { status: 400 }
      );
    }

    const questions = await generateAssessmentQuestions(
      prompt,
      Number(count) || 5
    );

    if (!questions || questions.length === 0) {
      return NextResponse.json(
        {
          error:
            "AI question generation is currently unavailable. Please try again.",
        },
        { status: 503 }
      );
    }

    await connectDB();

    const template = await AssessmentTemplate.create({
      name: name?.trim() || "AI-Generated Stress Assessment",
      description: `AI-generated from prompt: ${prompt.trim().slice(0, 140)}`,
      questions: questions.map((q) => ({ ...q, isActive: true })),
      maxScore: computeMaxScore(questions),
      isActive: true,
      createdBy: payload.id,
    });

    return NextResponse.json(
      {
        message: `Generated ${questions.length} question(s) into a new assessment`,
        template,
        count: questions.length,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[ai-generate] error:", error);
    return NextResponse.json(
      { error: "Failed to generate assessment" },
      { status: 500 }
    );
  }
}
