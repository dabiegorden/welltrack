import { type NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { cookies } from "next/headers";
import { connectDB } from "@/lib/config/mongodb";
import User from "@/lib/models/User";
import StressAssessment from "@/lib/models/StressAssessment";
import CounselingSession from "@/lib/models/Appointment";

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

    if (payload.role === "admin") {
      // Admin sees system-wide statistics
      const totalOfficers = await User.countDocuments({ role: "officer" });
      const totalCounselors = await User.countDocuments({ role: "counselor" });
      const totalAssessments = await StressAssessment.countDocuments();
      const highStressCount = await StressAssessment.countDocuments({
        stressLevel: "high",
      });
      const totalSessions = await CounselingSession.countDocuments();

      return NextResponse.json({
        role: "admin",
        stats: {
          totalOfficers,
          totalCounselors,
          totalAssessments,
          highStressCount,
          totalSessions,
          avgStressLevel:
            totalAssessments > 0
              ? (
                  await StressAssessment.aggregate([
                    { $group: { _id: null, avg: { $avg: "$score" } } },
                  ])
                )[0]?.avg.toFixed(2) || 0
              : 0,
        },
      });
    }

    if (payload.role === "officer") {
      // Officer sees personal statistics
      const myAssessments = await StressAssessment.countDocuments({
        officerId: payload.id,
      });
      const recentAssessment = await StressAssessment.findOne({
        officerId: payload.id,
      }).sort({ createdAt: -1 });

      const myBookings = await CounselingSession.countDocuments({
        officerId: payload.id,
      });
      const upcomingAppointments = await CounselingSession.countDocuments({
        officerId: payload.id,
        date: { $gte: new Date() },
      });

      return NextResponse.json({
        role: "officer",
        stats: {
          totalAssessments: myAssessments,
          lastStressLevel: recentAssessment?.stressLevel || "not-assessed",
          lastScore: (recentAssessment as any)?.score || 0,
          totalBookings: myBookings,
          upcomingAppointments,
        },
      });
    }

    if (payload.role === "counselor") {
      // Counselor sees assigned officers summary
      const assignedOfficers = await User.countDocuments({
        assignedCounselor: payload.id,
      });
      const totalSessions = await CounselingSession.countDocuments({
        counselorId: payload.id,
      });
      const upcomingSessions = await CounselingSession.countDocuments({
        counselorId: payload.id,
        date: { $gte: new Date() },
      });

      // Get high stress officers
      const highStressOfficers = await StressAssessment.aggregate([
        {
          $match: {
            stressLevel: "high",
            createdAt: {
              $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            }, // Last 30 days
          },
        },
        { $group: { _id: "$officerId" } },
        { $count: "total" },
      ]);

      return NextResponse.json({
        role: "counselor",
        stats: {
          assignedOfficers,
          totalSessions,
          upcomingSessions,
          highStressOfficersCount: highStressOfficers[0]?.total || 0,
        },
      });
    }

    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  } catch (error) {
    console.error("Stats API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
