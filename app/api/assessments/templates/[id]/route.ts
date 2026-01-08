import { type NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/config/mongodb";
import AssessmentTemplate from "@/lib/models/AssessmentTemplate";
import { requireRole } from "@/lib/middleware/auth-middleware";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectDB();

    const template = await AssessmentTemplate.findById(id);
    if (!template) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ template });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireRole(request, "admin");
    const { id } = await params;

    const body = await request.json();
    const { name, description, questions } = body;

    if (!name || !questions || questions.length === 0) {
      return NextResponse.json(
        { error: "Name and at least one question are required" },
        { status: 400 }
      );
    }

    await connectDB();

    const template = await AssessmentTemplate.findByIdAndUpdate(
      id,
      {
        name,
        description,
        questions: questions.map((q: any) => ({
          text: q.text || q.question,
          category: q.category || "wellbeing",
        })),
        maxScore: questions.length * 4,
      },
      { new: true }
    );

    if (!template) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ template });
  } catch (error: any) {
    if (error.message === "Forbidden") {
      return NextResponse.json(
        { error: "Only admins can update templates" },
        { status: 403 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireRole(request, "admin");
    const { id } = await params;

    await connectDB();

    const template = await AssessmentTemplate.findByIdAndDelete(id);
    if (!template) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Template deleted successfully" });
  } catch (error: any) {
    if (error.message === "Forbidden") {
      return NextResponse.json(
        { error: "Only admins can delete templates" },
        { status: 403 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
