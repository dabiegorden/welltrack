import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { connectDB } from "@/lib/config/mongodb";
import { verifyToken } from "@/lib/auth";
import User from "@/lib/models/User";
import Department, { DEFAULT_DEPARTMENTS } from "@/lib/models/Department";
import AssessmentResponse from "@/lib/models/AssessmentRespons";

async function getRole() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;
  return verifyToken(token);
}

// Seed the default Sefwi-Wiawso departments the first time
async function ensureDefaults() {
  const count = await Department.countDocuments();
  if (count === 0) {
    await Department.insertMany(
      DEFAULT_DEPARTMENTS.map((name) => ({ name }))
    );
  }
}

export async function GET() {
  const decoded = await getRole();
  if (!decoded) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();
    await ensureDefaults();

    const departments = await Department.find().sort({ name: 1 });
    const officers = await User.find({ role: "officer" }).select(
      "_id firstname lastname department serviceNumber rank"
    );

    // Latest assessment stress level per officer
    const assessments = await AssessmentResponse.find()
      .select("officerId stressLevel completedAt")
      .sort({ completedAt: -1 });

    const latestByOfficer = new Map<string, string>();
    for (const a of assessments) {
      const key = a.officerId?.toString();
      if (key && !latestByOfficer.has(key)) {
        latestByOfficer.set(key, a.stressLevel);
      }
    }

    const stats = departments.map((dept) => {
      const deptOfficers = officers.filter(
        (o) => (o.department || "") === dept.name
      );
      let low = 0,
        moderate = 0,
        high = 0;
      for (const o of deptOfficers) {
        const level = latestByOfficer.get(o._id.toString());
        if (level === "low") low++;
        else if (level === "moderate") moderate++;
        else if (level === "high") high++;
      }
      return {
        _id: dept._id,
        name: dept.name,
        code: dept.code,
        description: dept.description,
        isActive: dept.isActive,
        totalOfficers: deptOfficers.length,
        lowStress: low,
        moderateStress: moderate,
        highStress: high,
        officers: deptOfficers.map((o) => ({
          _id: o._id,
          name: `${o.firstname} ${o.lastname}`,
          serviceNumber: o.serviceNumber,
          rank: o.rank,
          stressLevel: latestByOfficer.get(o._id.toString()) || "not assessed",
        })),
      };
    });

    return NextResponse.json({ departments: stats });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const decoded = await getRole();
  if (!decoded || decoded.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    await connectDB();
    const { name, code, description } = await request.json();
    if (!name?.trim()) {
      return NextResponse.json(
        { error: "Department name is required" },
        { status: 400 }
      );
    }
    const exists = await Department.findOne({ name: name.trim() });
    if (exists) {
      return NextResponse.json(
        { error: "Department already exists" },
        { status: 400 }
      );
    }
    const dept = await Department.create({ name: name.trim(), code, description });
    return NextResponse.json({ department: dept }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
