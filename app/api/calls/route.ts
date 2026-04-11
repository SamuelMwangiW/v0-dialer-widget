import { neon } from "@neondatabase/serverless"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

const createCallSchema = z.object({
  contact_id: z.number().int().positive().optional().nullable(),
  agent_id: z.number().int().positive().optional().nullable(),
  direction: z.enum(["inbound", "outbound"]),
  phone_number: z.string().min(1),
  status: z.enum(["answered", "missed", "declined", "voicemail", "transferred"]),
  duration: z.number().int().min(0).default(0),
  notes: z.string().optional(),
  started_at: z.string().optional(),
  ended_at: z.string().optional(),
})

export async function GET(request: NextRequest) {
  const sql = neon(process.env.DATABASE_URL!)
  const searchParams = request.nextUrl.searchParams

  const page = parseInt(searchParams.get("page") || "1")
  const limit = parseInt(searchParams.get("limit") || "25")
  const offset = (page - 1) * limit
  const status = searchParams.get("status")
  const direction = searchParams.get("direction")
  const agentId = searchParams.get("agent_id")
  const contactId = searchParams.get("contact_id")
  const from = searchParams.get("from")
  const to = searchParams.get("to")
  const q = searchParams.get("q")

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
        c.name as contact_name,
        a.name as agent_name
      FROM call_logs cl
      LEFT JOIN contacts c ON c.id = cl.contact_id
      LEFT JOIN agents a ON a.id = cl.agent_id
      WHERE TRUE
        AND (${status}::text IS NULL OR cl.status = ${status})
        AND (${direction}::text IS NULL OR cl.direction = ${direction})
        AND (${agentId}::text IS NULL OR cl.agent_id = ${agentId}::integer)
        AND (${contactId}::text IS NULL OR cl.contact_id = ${contactId}::integer)
        AND (${from}::text IS NULL OR cl.started_at >= ${from}::timestamp)
        AND (${to}::text IS NULL OR cl.started_at <= ${to}::timestamp)
        AND (${q}::text IS NULL OR c.name ILIKE ${'%' + (q || '') + '%'} OR cl.phone_number LIKE ${'%' + (q || '') + '%'})
      ORDER BY cl.started_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `

    const countResult = await sql`
      SELECT COUNT(*) as total
      FROM call_logs cl
      LEFT JOIN contacts c ON c.id = cl.contact_id
      WHERE TRUE
        AND (${status}::text IS NULL OR cl.status = ${status})
        AND (${direction}::text IS NULL OR cl.direction = ${direction})
        AND (${agentId}::text IS NULL OR cl.agent_id = ${agentId}::integer)
        AND (${contactId}::text IS NULL OR cl.contact_id = ${contactId}::integer)
        AND (${from}::text IS NULL OR cl.started_at >= ${from}::timestamp)
        AND (${to}::text IS NULL OR cl.started_at <= ${to}::timestamp)
        AND (${q}::text IS NULL OR c.name ILIKE ${'%' + (q || '') + '%'} OR cl.phone_number LIKE ${'%' + (q || '') + '%'})
    `

    const total = parseInt(String(countResult[0]?.total || "0"))

    return NextResponse.json({
      data: calls,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error("Failed to fetch calls:", error)
    return NextResponse.json({ error: "Failed to fetch calls" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const sql = neon(process.env.DATABASE_URL!)

  try {
    const body = await request.json()
    const result = createCallSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: "Invalid request", details: result.error.issues }, { status: 400 })
    }

    const { contact_id, agent_id, direction, phone_number, status, duration, notes, started_at, ended_at } = result.data

    const calls = await sql`
      INSERT INTO call_logs (contact_id, agent_id, direction, phone_number, status, duration, notes, started_at, ended_at)
      VALUES (
        ${contact_id || null},
        ${agent_id || null},
        ${direction},
        ${phone_number},
        ${status},
        ${duration},
        ${notes || null},
        ${started_at ? new Date(started_at) : new Date()},
        ${ended_at ? new Date(ended_at) : null}
      )
      RETURNING id, contact_id, agent_id, direction, phone_number, status, duration, notes, started_at, ended_at
    `

    return NextResponse.json(calls[0], { status: 201 })
  } catch (error) {
    console.error("Failed to create call log:", error)
    return NextResponse.json({ error: "Failed to create call log" }, { status: 500 })
  }
}
