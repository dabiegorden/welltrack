import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { connectDB } from "@/lib/config/mongodb";
import User from "@/lib/models/User";
import { verifyToken } from "@/lib/auth";
import { Resend } from "resend";
import { EmailTemplate } from "@/components/EmailTemplate";
import bcrypt from "bcryptjs";

const resend = new Resend(process.env.RESEND_API_KEY);

async function isAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return false;
  const decoded = verifyToken(token);
  return decoded?.role === "admin";
}

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // ⛔ Only restrict writes, NOT reads
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role");

    await connectDB();

    const query: any = { role: { $ne: "admin" } };
    if (role) query.role = role;

    const users = await User.find(query).select(
      "firstname lastname email role phone address createdAt"
    );

    return NextResponse.json({ users });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();
    const { email, password, firstname, lastname, role, phone, address } =
      await request.json();

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const newUser = await User.create({
      email,
      password: hashedPassword,
      firstname,
      lastname,
      role,
      phone,
      address,
    });

    // The admin's token should remain unchanged

    // Send onboarding email
    try {
      if (process.env.RESEND_API_KEY) {
        const emailComponent = EmailTemplate({
          firstName: firstname,
          email,
          password,
          role,
          isNewUser: true,
        });

        await resend.emails.send({
          from: "support@jssolutionshub.com",
          to: [email],
          subject: `Welcome to WellTrack - Your ${role} Account`,
          react: await emailComponent,
        });
      }
    } catch (emailError) {
      console.error("Failed to send onboarding email:", emailError);
      // We don't fail the request if email fails
    }

    return NextResponse.json(
      {
        message: "User created successfully",
        user: {
          id: newUser._id,
          email: newUser.email,
          firstname: newUser.firstname,
          lastname: newUser.lastname,
          phone: newUser.phone,
          address: newUser.address,
          role: newUser.role,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
