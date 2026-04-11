import { neon } from "@neondatabase/serverless"
import { NextRequest, NextResponse } from "next/server"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const sql = neon(process.env.DATABASE_URL!)
  const { id } = await params

  const searchParams = request.nextUrl.searchParams
  const page = parseInt(searchParams.get("page") || "1")
  const limit = parseInt(searchParams.get("limit") || "25")
  const offset = (page - 1) * limit

  try {
    const calls = await sql`
      SELECT
        cl.id,
        cl.contact_id,
        cl.agent_id,
        cl.direction,
        cl.phone_number,
        cl.status,
        cl.duration,
        cl.notes,
        cl.started_at,
        cl.ended_at,
        a.name as agent_name
      FROM call_logs cl
      LEFT JOIN agents a ON a.id = cl.agent_id
      WHERE cl.contact_id = ${id}
      ORDER BY cl.started_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `

    const countResult = await sql`
      SELECT COUNT(*) as total FROM call_logs WHERE contact_id = ${id}
    `
    const total = parseInt(String(countResult[0]?.total || "0"))

    return NextResponse.json({
      data: calls,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error("Failed to fetch contact calls:", error)
    return NextResponse.json({ error: "Failed to fetch calls" }, { status: 500 })
  }
}
