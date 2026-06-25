import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { connectDB } from "@/lib/config/mongodb";
import { verifyToken } from "@/lib/auth";
import User from "@/lib/models/User";
import AssessmentResponse from "@/lib/models/AssessmentRespons";
import CounselingSession from "@/lib/models/CounselingSession";
import CounselorReport from "@/lib/models/CounselorReport";
import Prescription from "@/lib/models/Prescription";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const decoded = verifyToken(token);
  if (!decoded || decoded.role !== "counselor") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { id } = await params;
    await connectDB();

    const officer = await User.findById(id).select(
      "firstname lastname email serviceNumber rank unit department phone"
    );
    if (!officer) {
      return NextResponse.json({ error: "Officer not found" }, { status: 404 });
    }

    const [assessments, sessions, reports, prescriptions] = await Promise.all([
      AssessmentResponse.find({ officerId: id })
        .select("stressLevel totalScore maxScore completedAt createdAt")
        .sort({ createdAt: -1 })
        .lean(),
      CounselingSession.find({ officerId: id })
        .sort({ sessionDate: -1 })
        .lean(),
      CounselorReport.find({ officerId: id }).sort({ reportDate: -1 }).lean(),
      Prescription.find({ officerId: id }).sort({ createdAt: -1 }).lean(),
    ]);

    return NextResponse.json({
      officer,
      assessments,
      sessions,
      reports,
      prescriptions,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
