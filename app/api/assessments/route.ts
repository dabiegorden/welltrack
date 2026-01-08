import { type NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/config/mongodb";
import StressAssessment from "@/lib/models/StressAssessment";
import AssessmentTemplate from "@/lib/models/AssessmentTemplate";
import { requireAuth } from "@/lib/middleware/auth-middleware";
import { calculateStressScore } from "@/lib/utils/assessment-scoring";
import z from "zod";

const SubmitAssessmentSchema = z.object({
  templateId: z.string(),
  responses: z.array(z.number().min(0).max(4)).min(1),
});

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    await connectDB();

    const { searchParams } = new URL(request.url);
    const officerId = searchParams.get("officerId");
    const period = searchParams.get("period") || "all";

    // Build query based on role
    const query: any = {};

    if (auth.role === "officer") {
      // Officers can only see their own assessments
      query.officerId = auth.userId;
    } else if (auth.role === "counselor") {
      // Counselors can see assigned officers' assessments
      if (officerId) {
        query.officerId = officerId;
      }
      // TODO: Validate counselor is assigned to this officer
    } else if (auth.role === "admin") {
      // Admins can see all assessments or specific officer's
      if (officerId) {
        query.officerId = officerId;
      }
    }

    // Date filtering
    if (period !== "all") {
      const now = new Date();
      const startDate = new Date();

      switch (period) {
        case "week":
          startDate.setDate(now.getDate() - 7);
          break;
        case "month":
          startDate.setMonth(now.getMonth() - 1);
          break;
        case "quarter":
          startDate.setMonth(now.getMonth() - 3);
          break;
        case "year":
          startDate.setFullYear(now.getFullYear() - 1);
          break;
      }

      query.createdAt = { $gte: startDate };
    }

    const assessments = await StressAssessment.find(query)
      .populate("officerId", "firstname lastname email")
      .sort({ createdAt: -1 });

    return NextResponse.json({ assessments });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request);

    // Only officers can submit assessments
    if (auth.role !== "officer") {
      return NextResponse.json(
        { error: "Only officers can submit assessments" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { templateId, responses } = SubmitAssessmentSchema.parse(body);

    await connectDB();

    const template = await AssessmentTemplate.findById(templateId);
    if (!template) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    if (responses.length !== template.questions.length) {
      return NextResponse.json(
        { error: "Response count does not match template questions" },
        { status: 400 }
      );
    }

    // Calculate stress score
    const { totalScore, stressLevel } = calculateStressScore(responses);

    // Create assessment record
    const assessment = await StressAssessment.create({
      officerId: auth.userId,
      questions: template.questions.map((q: any, index) => ({
        questionId: q._id,
        question: q.text,
        score: responses[index],
      })),
      totalScore,
      stressLevel,
    });

    return NextResponse.json({ assessment }, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
