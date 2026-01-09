import { type NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { cookies } from "next/headers";
import { connectDB } from "@/lib/config/mongodb";
import User from "@/lib/models/User";
import AssessmentResponse from "@/lib/models/AssessmentRespons";

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

    const query: any = {};

    if (payload.role === "officer") {
      query.officerId = payload.id;
    } else if (payload.role === "counselor") {
      const assignedOfficers = await User.find(
        { assignedCounselor: payload.id },
        "_id"
      );
      const officerIds = assignedOfficers.map((o) => o._id);
      query.officerId = { $in: officerIds };
    }
    // admins get all data (empty query)

    const totalAssessments = await AssessmentResponse.countDocuments(query);

    const stressDistribution = await AssessmentResponse.aggregate([
      { $match: query },
      {
        $group: {
          _id: "$stressLevel",
          count: { $sum: 1 },
        },
      },
    ]);

    const trends = await AssessmentResponse.aggregate([
      { $match: query },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    const averageStress = await AssessmentResponse.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          average: { $avg: "$totalScore" },
          total: { $sum: 1 },
        },
      },
    ]);

    return NextResponse.json({
      stressDistribution: stressDistribution.map((item: any) => ({
        stressLevel: item._id,
        count: item.count,
      })),
      trends,
      averageStress: {
        average: averageStress[0]?.average || 0,
        total: averageStress[0]?.total || 0,
      },
      totalAssessments,
    });
  } catch (error) {
    console.error("[v0] Analytics API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
