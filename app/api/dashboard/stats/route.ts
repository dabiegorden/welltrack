import { type NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { cookies } from "next/headers";
import { connectDB } from "@/lib/config/mongodb";
import User from "@/lib/models/User";
import AssessmentResponse from "@/lib/models/AssessmentRespons";
import Appointment from "@/lib/models/Appointment";
import Resources from "@/lib/models/Resources";
import AssessmentTemplate from "@/lib/models/AssessmentTemplate";
import CounselingSession from "@/lib/models/CounselingSession";
import mongoose from "mongoose";

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
      const totalOfficers = await User.countDocuments({ role: "officer" });
      const totalCounselors = await User.countDocuments({ role: "counselor" });
      const totalAssessments = await AssessmentResponse.countDocuments();
      const highStressCount = await AssessmentResponse.countDocuments({
        stressLevel: "high",
      });
      const totalSessions = await Appointment.countDocuments();
      const totalResources = await Resources.countDocuments();
      const totalTemplates = await AssessmentTemplate.countDocuments();
      const aiHighRiskCount = await AssessmentResponse.countDocuments({
        "aiAnalysis.riskLevel": "high",
      });
      const aiCheckInCount = await AssessmentResponse.countDocuments({
        source: "ai-chat",
      });

      const stressDistribution = await AssessmentResponse.aggregate([
        {
          $group: {
            _id: "$stressLevel",
            count: { $sum: 1 },
          },
        },
      ]);

      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const assessmentTrend = await AssessmentResponse.aggregate([
        {
          $match: {
            createdAt: { $gte: sevenDaysAgo },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
            },
            count: { $sum: 1 },
          },
        },
        {
          $sort: { _id: 1 },
        },
      ]);

      const avgStressData = await AssessmentResponse.aggregate([
        {
          $group: {
            _id: null,
            average: { $avg: "$totalScore" },
          },
        },
      ]);

      return NextResponse.json({
        role: "admin",
        stats: {
          totalOfficers,
          totalCounselors,
          totalAssessments,
          highStressCount,
          totalSessions,
          totalResources,
          totalTemplates,
          avgStressLevel: avgStressData[0]?.average.toFixed(2) || 0,
          aiHighRiskCount,
          aiCheckInCount,
        },
        charts: {
          assessmentTrend: Array.from({ length: 7 }, (_, i) => {
            const date = new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000);
            const dateStr = date.toISOString().split("T")[0];
            const found = assessmentTrend.find(
              (item: any) => item._id === dateStr
            );
            return {
              date: dateStr,
              count: found?.count || 0,
            };
          }),
          stressDistribution: [
            {
              name: "Low",
              value:
                stressDistribution.find(
                  (s: any) => s._id?.toLowerCase() === "low"
                )?.count || 0,
            },
            {
              name: "Moderate",
              value:
                stressDistribution.find(
                  (s: any) => s._id?.toLowerCase() === "moderate"
                )?.count || 0,
            },
            {
              name: "High",
              value:
                stressDistribution.find(
                  (s: any) => s._id?.toLowerCase() === "high"
                )?.count || 0,
            },
          ],
        },
      });
    }

    if (payload.role === "officer") {
      const myAssessments = await AssessmentResponse.countDocuments({
        officerId: payload.id,
      });
      const recentAssessment = await AssessmentResponse.findOne({
        officerId: payload.id,
      }).sort({ createdAt: -1 });

      const myBookings = await Appointment.countDocuments({
        officerId: payload.id,
      });
      const upcomingAppointments = await Appointment.countDocuments({
        officerId: payload.id,
        date: { $gte: new Date() },
      });

      return NextResponse.json({
        role: "officer",
        stats: {
          totalAssessments: myAssessments,
          lastAssessmentDate: recentAssessment?.createdAt || null,
          totalBookings: myBookings,
          upcomingAppointments,
        },
      });
    }

    if (payload.role === "counselor") {
      const counselorObjId = new mongoose.Types.ObjectId(payload.id);

      // Officers this counselor has worked with (appointments OR recorded sessions)
      const [apptOfficers, sessionOfficers] = await Promise.all([
        Appointment.distinct("officerId", { counselorId: counselorObjId }),
        CounselingSession.distinct("officerId", {
          counselorId: counselorObjId,
        }),
      ]);
      const distinctOfficers = new Set(
        [...apptOfficers, ...sessionOfficers]
          .filter(Boolean)
          .map((o: any) => o.toString())
      );

      const totalAppointments = await Appointment.countDocuments({
        counselorId: counselorObjId,
      });
      const sessionsRecorded = await CounselingSession.countDocuments({
        counselorId: counselorObjId,
      });
      const upcomingSessions = await Appointment.countDocuments({
        counselorId: counselorObjId,
        date: { $gte: new Date() },
      });

      const sessionDistribution = await Appointment.aggregate([
        { $match: { counselorId: counselorObjId } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]);

      // Recorded sessions trend (last 7 days)
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const sessionTrend = await CounselingSession.aggregate([
        {
          $match: {
            counselorId: counselorObjId,
            sessionDate: { $gte: sevenDaysAgo },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$sessionDate" } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      const stressDistribution = await AssessmentResponse.aggregate([
        { $group: { _id: "$stressLevel", count: { $sum: 1 } } },
      ]);

      const highStressOfficers = await AssessmentResponse.aggregate([
        {
          $match: {
            stressLevel: "high",
            createdAt: {
              $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            },
          },
        },
        { $group: { _id: "$officerId" } },
        { $count: "total" },
      ]);

      const totalAssessments = await AssessmentResponse.countDocuments();
      const aiHighRiskCount = await AssessmentResponse.countDocuments({
        "aiAnalysis.riskLevel": "high",
      });

      return NextResponse.json({
        role: "counselor",
        stats: {
          assignedOfficers: distinctOfficers.size,
          totalSessions: totalAppointments,
          sessionsRecorded,
          upcomingSessions,
          highStressOfficersCount: highStressOfficers[0]?.total || 0,
          totalAssessments,
          aiHighRiskCount,
        },
        charts: {
          sessionDistribution: [
            {
              status: "Scheduled",
              count:
                sessionDistribution.find((s: any) => s._id === "scheduled")
                  ?.count || 0,
            },
            {
              status: "Completed",
              count:
                sessionDistribution.find((s: any) => s._id === "completed")
                  ?.count || 0,
            },
            {
              status: "Cancelled",
              count:
                sessionDistribution.find((s: any) => s._id === "cancelled")
                  ?.count || 0,
            },
          ],
          sessionTrend: Array.from({ length: 7 }, (_, i) => {
            const date = new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000);
            const dateStr = date.toISOString().split("T")[0];
            const found = sessionTrend.find((item: any) => item._id === dateStr);
            return { date: dateStr, count: found?.count || 0 };
          }),
          stressDistribution: [
            {
              name: "Low",
              value:
                stressDistribution.find(
                  (s: any) => s._id?.toLowerCase() === "low"
                )?.count || 0,
            },
            {
              name: "Moderate",
              value:
                stressDistribution.find(
                  (s: any) => s._id?.toLowerCase() === "moderate"
                )?.count || 0,
            },
            {
              name: "High",
              value:
                stressDistribution.find(
                  (s: any) => s._id?.toLowerCase() === "high"
                )?.count || 0,
            },
          ],
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
