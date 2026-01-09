import { type NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { cookies } from "next/headers";
import { connectDB } from "@/lib/config/mongodb";
import AssessmentTemplate from "@/lib/models/AssessmentTemplate";

export async function GET(request: NextRequest) {
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

    await connectDB();

    const templates = await AssessmentTemplate.find().sort({ createdAt: -1 });

    return NextResponse.json({ templates, data: templates });
  } catch (error) {
    console.error("[v0] Error fetching templates:", error);
    return NextResponse.json(
      { error: "Failed to fetch templates" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload || payload.role !== "admin") {
      return NextResponse.json(
        { error: "Only admins can create templates" },
        { status: 403 }
      );
    }

    const { name, description, questions } = await request.json();

    if (!name || !questions || !Array.isArray(questions)) {
      return NextResponse.json(
        { error: "Invalid template data" },
        { status: 400 }
      );
    }

    await connectDB();

    const template = await AssessmentTemplate.create({
      name,
      description,
      questions,
      maxScore: questions.length * 4,
      createdBy: payload.id,
    });

    return NextResponse.json(
      { template, message: "Template created successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("[v0] Error creating template:", error);
    return NextResponse.json(
      { error: "Failed to create template" },
      { status: 500 }
    );
  }
}
