import { NextResponse, type NextRequest } from "next/server";

const AUTH_COOKIE = "brancr_tenant_session";
const PUBLIC_PATHS = ["/login", "/signup", "/forgot-password"];

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some((path) => pathname.startsWith(path));
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/app") || pathname.startsWith("/admin")) {
    const hasSession = Boolean(request.cookies.get(AUTH_COOKIE)?.value);

    if (!hasSession) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Allow access to onboarding page
    if (pathname === "/app/onboarding") {
      return NextResponse.next();
    }

    // For other /app routes, OnboardingGuard will check onboarding status client-side
    // This is necessary because we need to make an API call to check onboarding status
    // which requires the session cookie that's already set
    return NextResponse.next();
  }

  if (isPublicPath(pathname)) {
    const hasSession = Boolean(request.cookies.get(AUTH_COOKIE)?.value);

    if (hasSession) {
      const appUrl = new URL("/app", request.url);
      return NextResponse.redirect(appUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/app/:path*", "/admin/:path*", "/login", "/signup", "/forgot-password"],
};

