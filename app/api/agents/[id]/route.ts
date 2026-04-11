import { neon } from "@neondatabase/serverless"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

const updateAgentSchema = z.object({
  name: z.string().min(1).optional(),
  extension: z.number().int().positive().optional(),
  status: z.enum(["online", "busy", "away"]).optional(),
  department: z.string().optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal("")),
})

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const sql = neon(process.env.DATABASE_URL!)
  const { id } = await params

  try {
    const agents = await sql`
      SELECT id, name, extension, status, department, email, avatar_url, created_at, updated_at
      FROM agents
      WHERE id = ${id}
      LIMIT 1
    `
    if (!agents[0]) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 })
    }
    return NextResponse.json(agents[0])
  } catch (error) {
    console.error("Failed to fetch agent:", error)
    return NextResponse.json({ error: "Failed to fetch agent" }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const sql = neon(process.env.DATABASE_URL!)
  const { id } = await params

  try {
    // Fetch current agent
    const existing = await sql`SELECT * FROM agents WHERE id = ${id} LIMIT 1`
    if (!existing[0]) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 })
    }

    const body = await request.json()
    const result = updateAgentSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: "Invalid request", details: result.error.issues }, { status: 400 })
    }

    const data = result.data
    const current = existing[0]

    const name = data.name ?? current.name
    const extension = data.extension ?? current.extension
    const status = data.status ?? current.status
    const department = data.department !== undefined ? (data.department || null) : current.department
    const email = data.email !== undefined ? (data.email || null) : current.email

    const agents = await sql`
      UPDATE agents SET
        name = ${name},
        extension = ${extension},
        status = ${status},
        department = ${department},
        email = ${email},
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING id, name, extension, status, department, email, avatar_url, created_at, updated_at
    `
    return NextResponse.json(agents[0])
  } catch (error) {
    console.error("Failed to update agent:", error)
    return NextResponse.json({ error: "Failed to update agent" }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const sql = neon(process.env.DATABASE_URL!)
  const { id } = await params

  try {
    await sql`DELETE FROM agents WHERE id = ${id}`
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Failed to delete agent:", error)
    return NextResponse.json({ error: "Failed to delete agent" }, { status: 500 })
  }
}
