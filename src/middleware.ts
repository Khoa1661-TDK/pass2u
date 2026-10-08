import { NextResponse, type NextRequest } from "next/server";

const PROTECTED = ["/market", "/listings", "/inbox", "/me", "/u/", "/admin", "/verify", "/check-email"];

// Fast redirect for signed-out visitors. Real authorization happens on the
// server in every page and action (see lib/session.ts).
export function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  if (PROTECTED.some((p) => path.startsWith(p)) && !req.cookies.has("pass2u_session")) {
    const url = new URL("/login", req.url);
    url.searchParams.set("next", path + req.nextUrl.search);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = { matcher: ["/((?!_next|api|uploads|favicon).*)"] };
