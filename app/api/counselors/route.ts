import { type NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/config/mongodb";
import User from "@/lib/models/User";
import { verifyToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload || payload.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await connectDB();

    const counselors = await User.find({ role: "counselor" }).select(
      "-password"
    );

    return NextResponse.json({
      data: counselors,
      count: counselors.length,
    });
  } catch (error) {
    console.error("Error fetching counselors:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload || payload.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { id, ...updates } = body;

    await connectDB();

    const counselor = await User.findByIdAndUpdate(id, updates, {
      new: true,
    }).select("-password");

    if (!counselor) {
      return NextResponse.json(
        { error: "Counselor not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: counselor });
  } catch (error) {
    console.error("Error updating counselor:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload || payload.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID required" }, { status: 400 });
    }

    await connectDB();

    const result = await User.findByIdAndDelete(id);

    if (!result) {
      return NextResponse.json(
        { error: "Counselor not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Counselor deleted successfully" });
  } catch (error) {
    console.error("Error deleting counselor:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
