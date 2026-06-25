import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { connectDB } from "@/lib/config/mongodb";
import { verifyToken } from "@/lib/auth";
import Prescription from "@/lib/models/Prescription";
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
    const prescriptions = await Prescription.find(query)
      .populate("officerId", "firstname lastname serviceNumber")
      .sort({ createdAt: -1 })
      .lean();
    return NextResponse.json({ prescriptions });
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
        { error: "Officer and title are required" },
        { status: 400 }
      );
    }
    const prescription = await Prescription.create({
      officerId: body.officerId,
      counselorId: counselor.id,
      sessionId: body.sessionId || undefined,
      title: body.title,
      description: body.description,
      supportPlan: body.supportPlan,
      followUpDate: body.followUpDate || undefined,
      status: body.status || "active",
    });
    return NextResponse.json({ prescription }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
