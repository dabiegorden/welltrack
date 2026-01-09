import { type NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { cookies } from "next/headers";
import { connectDB } from "@/lib/config/mongodb";
import AssessmentTemplate from "@/lib/models/AssessmentTemplate";
import { calculateStressLevel } from "@/lib/utils/Scoring";
import AssessmentResponse from "@/lib/models/AssessmentRespons";

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload || payload.role !== "officer") {
      return NextResponse.json(
        { error: "Only officers can submit assessments" },
        { status: 403 }
      );
    }

    const { templateId, responses, notes } = await request.json();

    if (!templateId || !responses || !Array.isArray(responses)) {
      return NextResponse.json(
        { error: "Invalid assessment data" },
        { status: 400 }
      );
    }

    await connectDB();

    const template = await AssessmentTemplate.findById(templateId);
    if (!template) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    // Calculate total score
    const totalScore = responses.reduce(
      (sum: number, r: any) => sum + (r.score || 0),
      0
    );
    const maxScore = template.maxScore || responses.length * 4;
    const stressLevel = calculateStressLevel(totalScore, maxScore);

    const assessment = await AssessmentResponse.create({
      officerId: payload.id,
      templateId,
      responses,
      totalScore,
      maxScore,
      stressLevel,
      notes,
    });

    return NextResponse.json(
      {
        message: "Assessment submitted successfully",
        assessment,
        stressLevel,
        totalScore,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[v0] Assessment submission error:", error);
    return NextResponse.json(
      { error: "Failed to submit assessment" },
      { status: 500 }
    );
  }
}
