import { SignJWT, jwtVerify } from "jose"
import { NextRequest, NextResponse } from "next/server"
import type { JWTPayload } from "./types"

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "callcenter-super-secret-key-change-in-production"
)
const COOKIE_NAME = "auth-token"
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7 // 7 days

export async function signToken(payload: Omit<JWTPayload, "iat" | "exp">): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET)
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as unknown as JWTPayload
  } catch {
    return null
  }
}

export async function getSession(request: NextRequest): Promise<JWTPayload | null> {
  const token = request.cookies.get(COOKIE_NAME)?.value
  if (!token) return null
  return verifyToken(token)
}

export function setSessionCookie(response: NextResponse, token: string): void {
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  })
}

export function clearSessionCookie(response: NextResponse): void {
  response.cookies.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  })
}

// These are Node.js only (not Edge runtime) — only import from route handlers
export async function hashPassword(password: string): Promise<string> {
  const bcrypt = await import("bcryptjs")
  return bcrypt.hash(password, 10)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const bcrypt = await import("bcryptjs")
  return bcrypt.compare(password, hash)
}
