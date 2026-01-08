import { type NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/config/mongodb";
import User from "@/lib/models/User";
import { verifyToken } from "@/lib/auth";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { EmailTemplate } from "@/components/EmailTemplate";
import { Resend } from "resend";

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

// POST REQUEST HANDLER TO CREATE A NEW COUNSELOR

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const token = request.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload || payload.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { email, firstname, lastname, phone, address } = await request.json();

    if (!email || !firstname || !lastname) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 409 }
      );
    }

    // 🔐 Generate secure password
    const rawPassword = crypto.randomBytes(8).toString("hex");
    const hashedPassword = await bcrypt.hash(rawPassword, 12);

    const counselor = await User.create({
      email,
      password: hashedPassword,
      firstname,
      lastname,
      phone,
      address,
      role: "counselor",
    });

    // 📧 Send onboarding email (non-blocking)
    try {
      if (process.env.RESEND_API_KEY) {
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
          from: "support@jssolutionshub.com",
          to: [email],
          subject: "Welcome to WellTrack – Your Counselor Account",
          react: await EmailTemplate({
            firstName: firstname,
            email,
            password: rawPassword,
            role: "counselor",
            isNewUser: true,
          }),
        });
      }
    } catch (emailError) {
      console.error("Failed to send onboarding email:", emailError);
      // Do NOT fail user creation if email fails
    }

    const safeUser = counselor.toObject();
    delete safeUser.password;

    return NextResponse.json({ data: safeUser }, { status: 201 });
  } catch (error) {
    console.error("Error creating counselor:", error);
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
