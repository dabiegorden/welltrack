import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import * as XLSX from "xlsx";
import { connectDB } from "@/lib/config/mongodb";
import User from "@/lib/models/User";
import { verifyToken } from "@/lib/auth";

async function isAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return false;
  const decoded = verifyToken(token);
  return decoded?.role === "admin";
}

// Map a spreadsheet row (case/space-insensitive keys) to a value
function pick(row: Record<string, any>, ...keys: string[]) {
  const normalized: Record<string, any> = {};
  Object.keys(row).forEach((k) => {
    normalized[k.toLowerCase().replace(/[\s_]/g, "")] = row[k];
  });
  for (const key of keys) {
    const v = normalized[key.toLowerCase().replace(/[\s_]/g, "")];
    if (v !== undefined && v !== null && String(v).trim() !== "")
      return String(v).trim();
  }
  return "";
}

export async function POST(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!["xlsx", "xls"].includes(ext || "")) {
      return NextResponse.json(
        { error: "Only .xlsx or .xls files are allowed" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows: Record<string, any>[] = XLSX.utils.sheet_to_json(sheet);

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "The spreadsheet is empty" },
        { status: 400 }
      );
    }

    await connectDB();

    const created: any[] = [];
    const failed: { row: number; serviceNumber?: string; reason: string }[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2; // account for header row

      const serviceNumber = pick(row, "Service Number", "serviceNumber", "sn");
      const fullName = pick(row, "Full Name", "fullName", "name");
      const rank = pick(row, "Rank");
      const unit = pick(row, "Unit");
      const department = pick(row, "Department", "dept");
      const contact = pick(row, "Contact", "phone", "phonenumber");
      let email = pick(row, "Email");

      if (!serviceNumber || !fullName) {
        failed.push({
          row: rowNum,
          serviceNumber,
          reason: "Missing required Service Number or Full Name",
        });
        continue;
      }

      // Derive a login email when not supplied
      if (!email) {
        email = `${serviceNumber.toLowerCase().replace(/[^a-z0-9]/g, "")}@welltrack.local`;
      }

      // Prevent duplicates by service number or email
      const dup = await User.findOne({
        $or: [{ serviceNumber }, { email: email.toLowerCase() }],
      });
      if (dup) {
        failed.push({
          row: rowNum,
          serviceNumber,
          reason: "Officer already exists (duplicate service number or email)",
        });
        continue;
      }

      const [firstname, ...rest] = fullName.split(" ");
      const lastname = rest.join(" ") || firstname;

      // Default password is the service number; officers should change it later
      const hashedPassword = await bcrypt.hash(serviceNumber, 12);

      try {
        const newUser = await User.create({
          email: email.toLowerCase(),
          password: hashedPassword,
          firstname,
          lastname,
          role: "officer",
          serviceNumber,
          rank,
          unit,
          department,
          contact,
          phone: contact,
        });
        created.push({
          serviceNumber: newUser.serviceNumber,
          name: fullName,
          email: newUser.email,
        });
      } catch (e: any) {
        failed.push({
          row: rowNum,
          serviceNumber,
          reason: e.message || "Failed to save",
        });
      }
    }

    return NextResponse.json({
      message: `Import complete: ${created.length} added, ${failed.length} failed`,
      createdCount: created.length,
      failedCount: failed.length,
      created,
      failed,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to import officers" },
      { status: 500 }
    );
  }
}
