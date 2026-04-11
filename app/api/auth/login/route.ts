import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { sql } from "@/lib/db"
import { signToken, setSessionCookie, verifyPassword } from "@/lib/auth"

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const result = loginSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 })
    }

    const { email, password } = result.data

    const users = await sql`
      SELECT id, name, email, password_hash, role, avatar_url
      FROM users
      WHERE email = ${email}
      LIMIT 1
    `

    const user = users[0]
    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    const valid = await verifyPassword(password, user.password_hash)
    if (!valid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    const token = await signToken({
      sub: String(user.id),
      email: user.email,
      name: user.name,
      role: user.role,
    })

    const response = NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar_url: user.avatar_url,
      },
    })

    setSessionCookie(response, token)
    return response
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
