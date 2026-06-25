import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { connectDB } from "@/lib/config/mongodb";
import { verifyToken } from "@/lib/auth";
import CounselingSession from "@/lib/models/CounselingSession";
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

    const sessions = await CounselingSession.find(query)
      .populate("officerId", "firstname lastname serviceNumber department")
      .sort({ sessionDate: -1 })
      .lean();
    return NextResponse.json({ sessions });
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
    if (!body.officerId) {
      return NextResponse.json(
        { error: "Officer is required" },
        { status: 400 }
      );
    }
    const session = await CounselingSession.create({
      officerId: body.officerId,
      counselorId: counselor.id,
      appointmentId: body.appointmentId || undefined,
      assessmentId: body.assessmentId || undefined,
      sessionDate: body.sessionDate || new Date(),
      sessionDiscussion: body.sessionDiscussion,
      officerConcerns: body.officerConcerns,
      counselorObservations: body.counselorObservations,
      counselingNotes: body.counselingNotes,
      sessionSummary: body.sessionSummary,
      followUpStatus: body.followUpStatus || "none",
      followUpDate: body.followUpDate || undefined,
    });
    return NextResponse.json({ session }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
