import { NextResponse } from "next/server";

/** Lets the root layout preload LCP assets only on the homepage. */
export function middleware(request) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-zoya-pathname", request.nextUrl.pathname);
  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico)$).*)",
  ],
};
