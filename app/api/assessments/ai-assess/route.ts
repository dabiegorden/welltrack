import { type NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { cookies } from "next/headers";
import { connectDB } from "@/lib/config/mongodb";
import AssessmentResponse from "@/lib/models/AssessmentRespons";
import { generateAssessmentFromText } from "@/lib/gemini";

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const { description, officerId } = await request.json();

    if (!description || typeof description !== "string" || !description.trim()) {
      return NextResponse.json(
        { error: "Please describe how you've been feeling" },
        { status: 400 }
      );
    }

    let targetOfficerId = payload.id;

    if (payload.role === "admin" || payload.role === "counselor") {
      if (!officerId) {
        return NextResponse.json(
          { error: "Please select an officer" },
          { status: 400 }
        );
      }
      targetOfficerId = officerId;
    } else if (payload.role !== "officer") {
      return NextResponse.json(
        { error: "Not authorized to submit assessments" },
        { status: 403 }
      );
    }

    const result = await generateAssessmentFromText(description);

    if (!result) {
      return NextResponse.json(
        { error: "AI analysis is currently unavailable. Please try again later." },
        { status: 503 }
      );
    }

    await connectDB();

    const assessment = await AssessmentResponse.create({
      officerId: targetOfficerId,
      source: "ai-chat",
      inputText: description,
      totalScore: result.totalScore,
      maxScore: result.maxScore,
      stressLevel: result.riskLevel,
      aiAnalysis: {
        summary: result.summary,
        riskLevel: result.riskLevel,
        recommendations: result.recommendations,
        generatedAt: new Date(),
      },
    });

    return NextResponse.json(
      {
        message: "Assessment generated successfully",
        assessment,
        stressLevel: result.riskLevel,
        totalScore: result.totalScore,
        maxScore: result.maxScore,
        summary: result.summary,
        recommendations: result.recommendations,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[v0] AI assessment error:", error);
    return NextResponse.json(
      { error: "Failed to generate assessment" },
      { status: 500 }
    );
  }
}
