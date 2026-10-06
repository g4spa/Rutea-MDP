import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const hasSession = Boolean(request.cookies.get("rutea_session")?.value);
  if (!hasSession && request.nextUrl.pathname === "/") {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}

export const config = { matcher: ["/"] };
