import { type NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { cookies } from "next/headers";
import { connectDB } from "@/lib/config/mongodb";
import AssessmentTemplate from "@/lib/models/AssessmentTemplate";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload || payload.role !== "admin") {
      return NextResponse.json(
        { error: "Only admins can update templates" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const { name, description, questions } = await request.json();

    await connectDB();

    const template = await AssessmentTemplate.findByIdAndUpdate(
      id,
      {
        name,
        description,
        questions,
        maxScore: questions.length * 4,
      },
      { new: true }
    );

    if (!template) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      template,
      message: "Template updated successfully",
    });
  } catch (error) {
    console.error("[v0] Error updating template:", error);
    return NextResponse.json(
      { error: "Failed to update template" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload || payload.role !== "admin") {
      return NextResponse.json(
        { error: "Only admins can delete templates" },
        { status: 403 }
      );
    }

    const { id } = await params;

    await connectDB();

    const template = await AssessmentTemplate.findByIdAndDelete(id);

    if (!template) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Template deleted successfully" });
  } catch (error) {
    console.error("[v0] Error deleting template:", error);
    return NextResponse.json(
      { error: "Failed to delete template" },
      { status: 500 }
    );
  }
}
