import { type NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { cookies } from "next/headers";
import { connectDB } from "@/lib/config/mongodb";
import User from "@/lib/models/User";
import AssessmentResponse from "@/lib/models/AssessmentRespons";
import Appointment from "@/lib/models/Appointment";
import CounselingSession from "@/lib/models/CounselingSession";

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

    // Admin-only: department comparison + counseling statistics
    let departmentComparison: any[] = [];
    let counselingStats = {
      totalAppointments: 0,
      completedAppointments: 0,
      pendingAppointments: 0,
      sessionsRecorded: 0,
    };

    if (payload.role === "admin") {
      departmentComparison = await AssessmentResponse.aggregate([
        {
          $lookup: {
            from: "users",
            localField: "officerId",
            foreignField: "_id",
            as: "officer",
          },
        },
        { $unwind: "$officer" },
        {
          $group: {
            _id: {
              department: { $ifNull: ["$officer.department", "Unassigned"] },
              stressLevel: "$stressLevel",
            },
            count: { $sum: 1 },
          },
        },
      ]);

      const [totalAppointments, completedAppointments, pendingAppointments] =
        await Promise.all([
          Appointment.countDocuments({}),
          Appointment.countDocuments({ status: "completed" }),
          Appointment.countDocuments({ status: "scheduled" }),
        ]);
      const sessionsRecorded = await CounselingSession.countDocuments({});
      counselingStats = {
        totalAppointments,
        completedAppointments,
        pendingAppointments,
        sessionsRecorded,
      };
    }

    // Shape department comparison: [{ department, low, moderate, high, total }]
    const deptMap = new Map<string, any>();
    for (const row of departmentComparison) {
      const dept = row._id.department;
      if (!deptMap.has(dept))
        deptMap.set(dept, {
          department: dept,
          low: 0,
          moderate: 0,
          high: 0,
          total: 0,
        });
      const entry = deptMap.get(dept);
      entry[row._id.stressLevel] = row.count;
      entry.total += row.count;
    }
    const departmentStats = Array.from(deptMap.values()).sort(
      (a, b) => b.high - a.high
    );

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
      departmentStats,
      counselingStats,
    });
  } catch (error) {
    console.error("[v0] Analytics API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
