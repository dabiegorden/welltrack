import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/config/mongodb";
import Appointment from "@/lib/models/Appointment";
import User from "@/lib/models/User";
import { verifyToken } from "@/lib/auth";
import { Resend } from "resend";
import AppointmentEmail from "@/components/AppointmentEmail";

const resend = new Resend(process.env.RESEND_API_KEY);

/* ----------------------------------------------------
   Helpers
---------------------------------------------------- */

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function forbidden() {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

/* ----------------------------------------------------
   GET — Fetch appointments
   Admin  → all
   Officer → own
   Counselor → assigned
---------------------------------------------------- */
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value;
    if (!token) return unauthorized();

    const payload = verifyToken(token);
    if (!payload) return forbidden();

    await connectDB();

    const query: any = {};

    if (payload.role === "officer") {
      query.officerId = payload.id;
    }

    if (payload.role === "counselor") {
      query.counselorId = payload.id;
    }

    const appointments = await Appointment.find(query)
      .populate("officerId", "firstname lastname email")
      .populate("counselorId", "firstname lastname email")
      .sort({ date: 1 });

    return NextResponse.json({
      data: appointments,
      count: appointments.length,
    });
  } catch (error) {
    console.error("GET /appointments error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/* ----------------------------------------------------
   POST — Create appointment (ADMIN only)
---------------------------------------------------- */
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value;
    if (!token) return unauthorized();

    const payload = verifyToken(token);
    if (!payload || payload.role !== "admin") return forbidden();

    const body = await request.json();
    const { officerId, counselorId, date, duration, status, notes } = body;

    // ✅ EXACTLY one must be provided
    if (!date || (officerId && counselorId) || (!officerId && !counselorId)) {
      return NextResponse.json(
        {
          error: "Appointment must be with either an officer OR a counselor",
        },
        { status: 400 }
      );
    }

    await connectDB();

    // ✅ Create appointment
    const appointment = await Appointment.create({
      officerId: officerId || null,
      counselorId: counselorId || null,
      date,
      duration,
      status: status || "scheduled",
      notes,
    });

    /* ---------- Send Email (Non-blocking & Correct) ---------- */
    /* ---------- Send Email (React Template) ---------- */
    if (process.env.RESEND_API_KEY) {
      try {
        let officerEmail = "";
        let counselorEmail = "";
        const recipients: string[] = [];

        if (officerId) {
          const officer = await User.findById(officerId).select("email");
          if (officer?.email) {
            officerEmail = officer.email;
            recipients.push(officer.email);
          }
        }

        if (counselorId) {
          const counselor = await User.findById(counselorId).select("email");
          if (counselor?.email) {
            counselorEmail = counselor.email;
            recipients.push(counselor.email);
          }
        }

        if (recipients.length > 0) {
          await resend.emails.send({
            from: "WellTrack <support@jssolutionshub.com>",
            to: recipients,
            subject: "Counseling Session Scheduled",
            react: await AppointmentEmail({
              appointmentDate: new Date(date).toLocaleString(),
              duration: duration || 60,
              officerEmail: officerEmail || "—",
              counselorEmail: counselorEmail || "—",
            }),
          });
        }
      } catch (emailError) {
        console.error("Email send failed:", emailError);
      }
    }

    return NextResponse.json({ data: appointment }, { status: 201 });
  } catch (error) {
    console.error("POST /appointments error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/* ----------------------------------------------------
   PUT — Update appointment
---------------------------------------------------- */
export async function PUT(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value;
    if (!token) return unauthorized();

    const payload = verifyToken(token);
    if (!payload) return forbidden();

    const body = await request.json();
    const { id, officerId, counselorId, ...rest } = body;

    const updates: any = {
      ...rest,
      officerId: officerId || null,
      counselorId: counselorId || null,
    };

    if (!id) {
      return NextResponse.json(
        { error: "Appointment ID required" },
        { status: 400 }
      );
    }

    await connectDB();

    const appointment = await Appointment.findByIdAndUpdate(id, updates, {
      new: true,
    });

    if (!appointment) {
      return NextResponse.json(
        { error: "Appointment not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: appointment });
  } catch (error) {
    console.error("PUT /appointments error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/* ----------------------------------------------------
   DELETE — Remove appointment
---------------------------------------------------- */
export async function DELETE(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value;
    if (!token) return unauthorized();

    const payload = verifyToken(token);
    if (!payload) return forbidden();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Appointment ID required" },
        { status: 400 }
      );
    }

    await connectDB();

    const deleted = await Appointment.findByIdAndDelete(id);

    if (!deleted) {
      return NextResponse.json(
        { error: "Appointment not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Appointment deleted successfully",
    });
  } catch (error) {
    console.error("DELETE /appointments error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
