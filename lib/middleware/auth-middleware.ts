import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import type { NextRequest } from "next/server";

export interface AuthPayload {
  userId: string;
  email: string;
  role: "admin" | "officer" | "counselor";
}

export async function getAuthPayload(
  request: NextRequest
): Promise<AuthPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    return null;
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return null;
  }

  return {
    userId: decoded.id,
    email: decoded.email,
    role: decoded.role,
  };
}

export async function requireAuth(request: NextRequest): Promise<AuthPayload> {
  const auth = await getAuthPayload(request);
  if (!auth) {
    throw new Error("Unauthorized");
  }
  return auth;
}

export async function requireRole(
  request: NextRequest,
  ...roles: string[]
): Promise<AuthPayload> {
  const auth = await requireAuth(request);
  if (!roles.includes(auth.role)) {
    throw new Error("Forbidden");
  }
  return auth;
}
