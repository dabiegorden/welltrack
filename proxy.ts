import { type NextRequest, NextResponse } from "next/server";
import { verifyToken } from "./lib/auth";

export default function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const token = request.cookies.get("token")?.value;

  // Paths requiring authentication
  const isAdminRoute =
    pathname.startsWith("/admin-dashboard") ||
    pathname.startsWith("/api/admin");

  if (isAdminRoute) {
    if (!token) {
      return NextResponse.redirect(new URL("/sign-in", request.url));
    }

    const payload = verifyToken(token);
    if (!payload) {
      const response = NextResponse.redirect(new URL("/sign-in", request.url));
      response.cookies.delete("token");
      return response;
    }

    // All authenticated users can access admin-dashboard, sidebar will show appropriate links based on role
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin-dashboard/:path*", "/api/admin/:path*"],
};
