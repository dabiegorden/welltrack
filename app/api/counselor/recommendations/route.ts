import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { connectDB } from "@/lib/config/mongodb";
import { verifyToken } from "@/lib/auth";
import Recommendation from "@/lib/models/Recommendation";
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
    const recommendations = await Recommendation.find(query)
      .populate("officerId", "firstname lastname serviceNumber")
      .sort({ createdAt: -1 })
      .lean();
    return NextResponse.json({ recommendations });
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
    if (!body.officerId || !body.details?.trim()) {
      return NextResponse.json(
        { error: "Officer and recommendation details are required" },
        { status: 400 }
      );
    }
    const recommendation = await Recommendation.create({
      officerId: body.officerId,
      counselorId: counselor.id,
      sessionId: body.sessionId || undefined,
      type: body.type || "other",
      details: body.details,
    });
    return NextResponse.json({ recommendation }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
