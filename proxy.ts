import { NextResponse, type NextRequest } from "next/server";

const protectedPrefixes = ["/dashboard", "/admin"];
const authCookieName = process.env.AUTH_COOKIE_NAME ?? "authjs.session-token";

// Optimistic auth guard: hanya mengecek kehadiran cookie sesi.
// Authorisasi penuh tetap dilakukan di layout & server action (lihat data-security).
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = protectedPrefixes.some((prefix) =>
    pathname.startsWith(prefix),
  );
  if (!isProtected) {
    return NextResponse.next();
  }

  const hasSession = request.cookies.getAll().some((c) =>
    c.name.includes("session-token"),
  );

  // Cookie sesi NextAuth (jwt) selalu bernama authjs.session-token
  const hasAuthCookie = request.cookies.has(authCookieName);

  if (!hasAuthCookie && !hasSession) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*"],
};
