import { NextResponse, type NextRequest } from "next/server";

// Guard before streaming: notFound() behind a loading boundary can already have sent HTTP 200.
export function proxy(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    const url = request.nextUrl.clone();
    url.pathname = "/_not-found";
    return NextResponse.rewrite(url, { status: 404 });
  }
  return NextResponse.next();
}
export const config = { matcher: ["/design", "/design/:path*"] };
