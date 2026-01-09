import { type NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { cookies } from "next/headers";
import { connectDB } from "@/lib/config/mongodb";
import Appointment from "@/lib/models/Appointment";
import User from "@/lib/models/User";
import { Resend } from "resend";
import AppointmentEmail from "@/components/AppointmentEmail";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    /* ------------------ Auth ------------------ */
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload || payload.role !== "officer") {
      return NextResponse.json(
        { error: "Only officers can book appointments" },
        { status: 403 }
      );
    }

    /* ------------------ Input ------------------ */
    const body = await request.json();
    const { counselorId, date, notes } = body;

    if (!counselorId || !date) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    await connectDB();

    /* ------------------ Create Appointment ------------------ */
    const appointment = await Appointment.create({
      officerId: payload.id,
      counselorId,
      date: new Date(date),
      notes,
      status: "scheduled",
    });

    /* ------------------ Send Email (Counselor ONLY) ------------------ */
    if (process.env.RESEND_API_KEY) {
      try {
        const counselor = await User.findById(counselorId).select(
          "email firstname lastname"
        );

        if (counselor?.email) {
          await resend.emails.send({
            from: "WellTrack <support@jssolutionshub.com>",
            to: counselor.email, // ✅ ONLY counselor
            subject: "New Counseling Appointment Booked",
            react: await AppointmentEmail({
              appointmentDate: new Date(date).toLocaleString(),
              duration: 60,
              officerEmail: "Confidential",
              counselorEmail: counselor.email,
            }),
          });
        }
      } catch (emailError) {
        console.error("Counselor email send failed:", emailError);
        // ❗ Do not block booking if email fails
      }
    }

    /* ------------------ Response ------------------ */
    return NextResponse.json(
      {
        message: "Appointment booked successfully",
        appointment,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /appointments/book error:", error);
    return NextResponse.json(
      { error: "Failed to book appointment" },
      { status: 500 }
    );
  }
}
