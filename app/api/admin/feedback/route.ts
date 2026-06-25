import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { connectDB } from "@/lib/config/mongodb";
import { verifyToken } from "@/lib/auth";
import CounselingSession from "@/lib/models/CounselingSession";
import Recommendation from "@/lib/models/Recommendation";
import AssessmentResponse from "@/lib/models/AssessmentRespons";
import "@/lib/models/User";

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const decoded = verifyToken(token);
  if (!decoded || decoded.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const department = searchParams.get("department");
    const counselor = searchParams.get("counselor");
    const stressLevel = searchParams.get("stressLevel");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const query: any = {};
    if (counselor) query.counselorId = counselor;
    if (from || to) {
      query.sessionDate = {};
      if (from) query.sessionDate.$gte = new Date(from);
      if (to) query.sessionDate.$lte = new Date(to);
    }

    const sessions = await CounselingSession.find(query)
      .populate("officerId", "firstname lastname department serviceNumber")
      .populate("counselorId", "firstname lastname")
      .sort({ sessionDate: -1 })
      .lean();

    // Latest stress level per officer
    const assessments = await AssessmentResponse.find()
      .select("officerId stressLevel completedAt")
      .sort({ completedAt: -1 })
      .lean();
    const latestStress = new Map<string, string>();
    for (const a of assessments) {
      const key = a.officerId?.toString();
      if (key && !latestStress.has(key)) latestStress.set(key, a.stressLevel);
    }

    // Recommendations grouped by session
    const recs = await Recommendation.find().lean();
    const recsBySession = new Map<string, any[]>();
    for (const r of recs) {
      const key = r.sessionId?.toString();
      if (!key) continue;
      if (!recsBySession.has(key)) recsBySession.set(key, []);
      recsBySession.get(key)!.push(r);
    }

    let feedback = sessions.map((s: any) => {
      const officer = s.officerId || {};
      const officerStress = latestStress.get(officer._id?.toString()) || "not assessed";
      return {
        _id: s._id,
        officerName: officer.firstname
          ? `${officer.firstname} ${officer.lastname}`
          : "Unknown",
        officerDepartment: officer.department || "—",
        serviceNumber: officer.serviceNumber || "—",
        counselorName: s.counselorId
          ? `${s.counselorId.firstname} ${s.counselorId.lastname}`
          : "Unknown",
        counselorId: s.counselorId?._id,
        sessionDate: s.sessionDate,
        sessionDiscussion: s.sessionDiscussion || "",
        officerConcerns: s.officerConcerns || "",
        counselorObservations: s.counselorObservations || "",
        counselingNotes: s.counselingNotes || "",
        sessionSummary: s.sessionSummary || "",
        followUpStatus: s.followUpStatus,
        followUpDate: s.followUpDate,
        createdAt: s.createdAt,
        stressLevel: officerStress,
        recommendations: (recsBySession.get(s._id.toString()) || []).map(
          (r) => r.details
        ),
      };
    });

    // Post-filter by department / stress level (depend on populated/derived data)
    if (department)
      feedback = feedback.filter((f) => f.officerDepartment === department);
    if (stressLevel)
      feedback = feedback.filter((f) => f.stressLevel === stressLevel);

    return NextResponse.json({ feedback });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
