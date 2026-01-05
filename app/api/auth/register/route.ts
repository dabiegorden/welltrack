import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/config/mongodb";
import User from "@/lib/models/User";
import { generateToken } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    await connectDB();
    const { email, password, firstname, lastname, phone, address } =
      await request.json();

    // Check if an admin already exists to prevent multiple admins via this endpoint
    const existingAdmin = await User.findOne({ role: "admin" });
    if (existingAdmin) {
      return NextResponse.json(
        {
          error:
            "Admin already exists. Use the dashboard to create other users.",
        },
        { status: 403 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const newAdmin = await User.create({
      email,
      password: hashedPassword,
      firstname,
      lastname,
      role: "admin",
    });

    const token = generateToken({
      id: newAdmin._id.toString(),
      email: newAdmin.email,
      role: newAdmin.role,
    });

    const response = NextResponse.json(
      {
        message: "Admin created successfully",
        user: {
          id: newAdmin._id,
          email: newAdmin.email,
          firstname: newAdmin.firstname,
          lastname: newAdmin.lastname,
          phone: newAdmin.phone,
          address: newAdmin.address,
          role: newAdmin.role,
        },
      },
      { status: 201 }
    );

    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });

    return response;
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
