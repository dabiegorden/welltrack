import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { connectDB } from "@/lib/config/mongodb";
import { verifyToken } from "@/lib/auth";
import CounselorReport from "@/lib/models/CounselorReport";
import "@/lib/models/User";

async function getCounselor() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;
  const decoded = verifyToken(token);
  return decoded?.role === "counselor" ? decoded : null;
}

export async function GET(request: Request) {
  const counselor = await getCounselor();
  if (!counselor) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const officerId = searchParams.get("officerId");
    const query: any = { counselorId: counselor.id };
    if (officerId) query.officerId = officerId;
    const reports = await CounselorReport.find(query)
      .populate("officerId", "firstname lastname serviceNumber department")
      .sort({ reportDate: -1 })
      .lean();
    return NextResponse.json({ reports });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const counselor = await getCounselor();
  if (!counselor) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    await connectDB();
    const body = await request.json();
    if (!body.officerId || !body.title?.trim()) {
      return NextResponse.json(
        { error: "Officer and report title are required" },
        { status: 400 }
      );
    }
    const report = await CounselorReport.create({
      officerId: body.officerId,
      counselorId: counselor.id,
      sessionId: body.sessionId || undefined,
      prescriptionId: body.prescriptionId || undefined,
      templateType: body.templateType || "general-wellness",
      title: body.title,
      assessmentResult: body.assessmentResult,
      counselorNotes: body.counselorNotes,
      sessionSummary: body.sessionSummary,
      recommendations: body.recommendations,
      reportDate: body.reportDate || new Date(),
    });
    return NextResponse.json({ report }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
