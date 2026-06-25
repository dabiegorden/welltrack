import { type NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { cookies } from "next/headers";
import { connectDB } from "@/lib/config/mongodb";
import Appointment from "@/lib/models/Appointment";
import User from "@/lib/models/User";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

async function getCounselor() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;
  const decoded = verifyToken(token);
  return decoded?.role === "counselor" ? decoded : null;
}

async function ownedAppointment(id: string, counselorId: string) {
  const appt = await Appointment.findById(id);
  if (!appt) return null;
  if (appt.counselorId?.toString() !== counselorId) return "forbidden";
  return appt;
}

/* PATCH — update status / date / notes */
export async function PATCH(request: NextRequest) {
  const counselor = await getCounselor();
  if (!counselor) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    await connectDB();
    const { appointmentId, status, date, notes, duration } =
      await request.json();
    if (!appointmentId) {
      return NextResponse.json(
        { error: "Appointment ID required" },
        { status: 400 }
      );
    }
    const owned = await ownedAppointment(appointmentId, counselor.id);
    if (!owned)
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (owned === "forbidden")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    if (status) owned.status = status;
    if (date) owned.date = new Date(date);
    if (notes !== undefined) owned.notes = notes;
    if (duration) owned.duration = duration;
    await owned.save();

    const appointment = await Appointment.findById(appointmentId)
      .populate("officerId", "firstname lastname email phone")
      .populate("counselorId", "firstname lastname email");

    return NextResponse.json({ appointment });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/* DELETE — remove an appointment */
export async function DELETE(request: NextRequest) {
  const counselor = await getCounselor();
  if (!counselor) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json(
        { error: "Appointment ID required" },
        { status: 400 }
      );
    }
    const owned = await ownedAppointment(id, counselor.id);
    if (!owned)
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (owned === "forbidden")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    await Appointment.findByIdAndDelete(id);
    return NextResponse.json({ message: "Appointment deleted" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/* POST — reply to the officer by email */
export async function POST(request: NextRequest) {
  const counselor = await getCounselor();
  if (!counselor) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    await connectDB();
    const { appointmentId, message } = await request.json();
    if (!appointmentId || !message?.trim()) {
      return NextResponse.json(
        { error: "Appointment and message are required" },
        { status: 400 }
      );
    }
    const owned = await ownedAppointment(appointmentId, counselor.id);
    if (!owned)
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (owned === "forbidden")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const officer = await User.findById(owned.officerId).select(
      "email firstname lastname"
    );
    const counselorUser = await User.findById(counselor.id).select(
      "firstname lastname"
    );

    if (!officer?.email) {
      return NextResponse.json(
        { error: "Officer has no email on file" },
        { status: 400 }
      );
    }

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { error: "Email service is not configured" },
        { status: 503 }
      );
    }

    await resend.emails.send({
      from: "WellTrack <support@jssolutionshub.com>",
      to: [officer.email],
      subject: "Message regarding your counseling appointment",
      html: `
        <p>Dear ${officer.firstname} ${officer.lastname},</p>
        <p>${message.replace(/\n/g, "<br/>")}</p>
        <p>Appointment: ${new Date(owned.date).toLocaleString()}</p>
        <p>Regards,<br/>Counselor ${counselorUser?.firstname || ""} ${
          counselorUser?.lastname || ""
        }<br/>Sefwi-Wiawso Divisional Well Track System</p>
      `,
    });

    return NextResponse.json({ message: "Reply sent to officer" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
