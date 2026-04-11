import { NextRequest, NextResponse } from "next/server"
import { jwtVerify } from "jose"

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "callcenter-super-secret-key-change-in-production"
)

const PUBLIC_PATHS = ["/login", "/api/auth/login", "/api/auth/logout"]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public paths through without auth
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    // If already authenticated and hitting /login, redirect to dashboard
    if (pathname === "/login") {
      const token = request.cookies.get("auth-token")?.value
      if (token) {
        try {
          await jwtVerify(token, JWT_SECRET)
          return NextResponse.redirect(new URL("/", request.url))
        } catch {
          // invalid token — let them through to login
        }
      }
    }
    return NextResponse.next()
  }

  // Verify session for all other routes
  const token = request.cookies.get("auth-token")?.value

  if (!token) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("from", pathname)
    return NextResponse.redirect(loginUrl)
  }

  try {
    await jwtVerify(token, JWT_SECRET)
    return NextResponse.next()
  } catch {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("from", pathname)
    const response = NextResponse.redirect(loginUrl)
    response.cookies.set("auth-token", "", { maxAge: 0, path: "/" })
    return response
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.*|apple-icon.*|.*\\.png$|.*\\.svg$|.*\\.ico$).*)",
  ],
}
