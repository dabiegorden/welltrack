import { type NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/config/mongodb";
import AssessmentTemplate from "@/lib/models/AssessmentTemplate";
import { requireRole } from "@/lib/middleware/auth-middleware";
import z from "zod";

const CreateTemplateSchema = z.object({
  name: z.string().min(1, "Template name is required"),
  description: z.string().optional(),
  questions: z
    .array(
      z.object({
        text: z.string().min(1, "Question text is required"),
        category: z
          .enum(["workload", "support", "wellbeing", "environment"])
          .optional(),
      })
    )
    .min(1, "At least one question is required"),
});

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const templates = await AssessmentTemplate.find({ isActive: true }).select(
      "-createdBy"
    );

    return NextResponse.json({ templates, data: templates });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireRole(request, "admin");

    const body = await request.json();

    const validatedData = {
      name: body.name || body.title,
      description: body.description,
      questions: (body.questions || [])
        .filter((q: any) => q.text && q.text.trim())
        .map((q: any) => ({
          text: q.text || q.question,
          category: q.category || "wellbeing",
        })),
    };

    if (!validatedData.name) {
      return NextResponse.json(
        { error: "Template name is required" },
        { status: 400 }
      );
    }

    if (validatedData.questions.length === 0) {
      return NextResponse.json(
        { error: "At least one question is required" },
        { status: 400 }
      );
    }

    await connectDB();

    const maxScore = validatedData.questions.length * 4;

    const template = await AssessmentTemplate.create({
      ...validatedData,
      maxScore,
      createdBy: auth.userId,
      isActive: true,
    });

    return NextResponse.json({ template, data: template }, { status: 201 });
  } catch (error: any) {
    console.error("[v0] Template creation error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error.message === "Forbidden") {
      return NextResponse.json(
        { error: "Only admins can create templates" },
        { status: 403 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
