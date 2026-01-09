import { NextResponse } from "next/server";
import { connectDB } from "@/lib/config/mongodb";
import User from "@/lib/models/User";

export async function GET() {
  try {
    await connectDB();
    const counselors = await User.find({ role: "counselor" }).select(
      "firstname lastname _id"
    );
    return NextResponse.json({ counselors });
  } catch (error) {
    console.error("[v0] Error fetching counselors:", error);
    return NextResponse.json(
      { error: "Failed to fetch counselors" },
      { status: 500 }
    );
  }
}
