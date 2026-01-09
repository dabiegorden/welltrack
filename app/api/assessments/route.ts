import { type NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { cookies } from "next/headers";
import { connectDB } from "@/lib/config/mongodb";
import User from "@/lib/models/User";
import AssessmentResponse from "@/lib/models/AssessmentRespons";

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

    let assessments;
    if (payload.role === "admin") {
      // Admins see all assessments
      assessments = await AssessmentResponse.find()
        .populate("officerId", "firstname lastname email")
        .populate("templateId", "name")
        .sort({ createdAt: -1 })
        .limit(50);
    } else if (payload.role === "officer") {
      // Officers see only their assessments
      assessments = await AssessmentResponse.find({ officerId: payload.id })
        .populate("templateId", "name")
        .sort({ createdAt: -1 });
    } else if (payload.role === "counselor") {
      // Counselors see assessments of assigned officers
      const assignedOfficers = await User.find(
        { assignedCounselor: payload.id },
        "_id"
      );
      const officerIds = assignedOfficers.map((o) => o._id);

      assessments = await AssessmentResponse.find({
        officerId: { $in: officerIds },
      })
        .populate("officerId", "firstname lastname email")
        .populate("templateId", "name")
        .sort({ createdAt: -1 });
    }

    return NextResponse.json({ data: assessments, success: true });
  } catch (error) {
    console.error("[v0] Error fetching assessments:", error);
    return NextResponse.json(
      { error: "Failed to fetch assessments" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload || payload.role !== "admin") {
      return NextResponse.json(
        { error: "Only admins can delete assessments" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Assessment ID required" },
        { status: 400 }
      );
    }

    await connectDB();

    const result = await AssessmentResponse.findByIdAndDelete(id);

    if (!result) {
      return NextResponse.json(
        { error: "Assessment not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Assessment deleted successfully" });
  } catch (error) {
    console.error("[v0] Error deleting assessment:", error);
    return NextResponse.json(
      { error: "Failed to delete assessment" },
      { status: 500 }
    );
  }
}
