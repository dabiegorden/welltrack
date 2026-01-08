import { type NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/config/mongodb";
import StressAssessment from "@/lib/models/StressAssessment";
import { requireRole } from "@/lib/middleware/auth-middleware";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireRole(request, "admin");

    await connectDB();

    // Aggregated anonymous analytics - NO individual officer data
    const stressDistribution = await StressAssessment.aggregate([
      {
        $group: {
          _id: "$stressLevel",
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          stressLevel: "$_id",
          count: 1,
          _id: 0,
        },
      },
    ]);

    const averageStress = await StressAssessment.aggregate([
      {
        $group: {
          _id: null,
          average: { $avg: "$totalScore" },
          total: { $sum: 1 },
        },
      },
    ]);

    const trends = await StressAssessment.aggregate([
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          count: { $sum: 1 },
          avgScore: { $avg: "$totalScore" },
        },
      },
      {
        $sort: {
          "_id.year": 1,
          "_id.month": 1,
        },
      },
      {
        $limit: 12,
      },
    ]);

    return NextResponse.json({
      stressDistribution,
      averageStress: averageStress[0] || { average: 0, total: 0 },
      trends,
    });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error.message === "Forbidden") {
      return NextResponse.json(
        { error: "Only admins can view analytics" },
        { status: 403 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
