import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { connectDB } from "@/lib/config/mongodb";
import { verifyToken } from "@/lib/auth";
import User from "@/lib/models/User";
import AssessmentResponse from "@/lib/models/AssessmentRespons";
import Appointment from "@/lib/models/Appointment";
import MonthlyReport from "@/lib/models/MonthlyReport";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

async function isAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;
  const decoded = verifyToken(token);
  return decoded?.role === "admin" ? decoded : null;
}

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    await connectDB();
    const reports = await MonthlyReport.find()
      .sort({ year: -1, month: -1 })
      .lean();
    return NextResponse.json({ reports });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const admin = await isAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    await connectDB();
    const { month, year } = await request.json();
    if (!month || !year) {
      return NextResponse.json(
        { error: "Month and year are required" },
        { status: 400 }
      );
    }

    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 1);

    const assessments = await AssessmentResponse.find({
      completedAt: { $gte: start, $lt: end },
    })
      .populate("officerId", "department")
      .lean();

    const assessmentStats = {
      totalAssessed: new Set(
        assessments.map((a: any) => a.officerId?._id?.toString()).filter(Boolean)
      ).size,
      lowStress: assessments.filter((a) => a.stressLevel === "low").length,
      moderateStress: assessments.filter((a) => a.stressLevel === "moderate")
        .length,
      highStress: assessments.filter((a) => a.stressLevel === "high").length,
    };

    const [sessionsCompleted, pendingSessions, activeCounselors] =
      await Promise.all([
        Appointment.countDocuments({
          status: "completed",
          date: { $gte: start, $lt: end },
        }),
        Appointment.countDocuments({
          status: "scheduled",
          date: { $gte: start, $lt: end },
        }),
        User.countDocuments({ role: "counselor" }),
      ]);

    // Department breakdown
    const deptMap = new Map<string, any>();
    for (const a of assessments as any[]) {
      const dept = a.officerId?.department || "Unassigned";
      if (!deptMap.has(dept))
        deptMap.set(dept, {
          department: dept,
          totalOfficers: 0,
          lowStress: 0,
          moderateStress: 0,
          highStress: 0,
        });
      const entry = deptMap.get(dept);
      entry.totalOfficers += 1;
      if (a.stressLevel === "low") entry.lowStress += 1;
      else if (a.stressLevel === "moderate") entry.moderateStress += 1;
      else if (a.stressLevel === "high") entry.highStress += 1;
    }

    const payload = {
      month,
      year,
      title: `${MONTHS[month - 1]} ${year} Wellness Report`,
      generatedBy: admin.id,
      assessmentStats,
      counselingStats: { sessionsCompleted, pendingSessions, activeCounselors },
      departmentStats: Array.from(deptMap.values()),
    };

    const report = await MonthlyReport.findOneAndUpdate(
      { month, year },
      payload,
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    return NextResponse.json({ report }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
