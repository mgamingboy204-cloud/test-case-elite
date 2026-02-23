import { NextRequest, NextResponse } from "next/server";

const APP_ROOT_PATH = "/app";

function isBypassPath(pathname: string) {
  return pathname.startsWith("/_next") || pathname.startsWith("/api") || pathname.startsWith("/icons") || pathname === "/manifest.webmanifest" || pathname === "/favicon.ico";
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const emAppCookie = request.cookies.get("em_app")?.value;

  if (emAppCookie === "1" && !pathname.startsWith(APP_ROOT_PATH) && !isBypassPath(pathname)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = APP_ROOT_PATH;
    redirectUrl.search = "";
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|.*\\..*).*)"]
};
