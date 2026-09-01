import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED_PREFIXES = [
  "/account",
  "/checkout",
  "/bookings",
  "/chat",
  "/cart",
  "/seller",
  "/agent",
  "/onboarding",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  if (!isProtected) {
    return NextResponse.next();
  }

  const hasSession = request.cookies.get("paykop_session")?.value === "1";
  if (hasSession) {
    return NextResponse.next();
  }

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/login";
  loginUrl.searchParams.set("redirect", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    "/account/:path*",
    "/checkout",
    "/bookings",
    "/chat",
    "/cart",
    "/seller/:path*",
    "/agent/:path*",
    "/onboarding",
  ],
};
