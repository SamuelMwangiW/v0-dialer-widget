import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { sql } from "@/lib/db"

export async function GET(request: NextRequest) {
  const session = await getSession(request)
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const users = await sql`
      SELECT id, name, email, role, avatar_url
      FROM users
      WHERE id = ${session.sub}
      LIMIT 1
    `
    if (!users[0]) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }
    return NextResponse.json({ user: users[0] })
  } catch (error) {
    console.error("Me error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
