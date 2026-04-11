import { neon } from "@neondatabase/serverless"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

const createAgentSchema = z.object({
  name: z.string().min(1),
  extension: z.number().int().positive(),
  status: z.enum(["online", "busy", "away"]).default("online"),
  department: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
})

export async function GET() {
  try {
    const sql = neon(process.env.DATABASE_URL!)

    const agents = await sql`
      SELECT id, name, extension, status, department, email, avatar_url, created_at, updated_at
      FROM agents
      ORDER BY name ASC
    `

    return NextResponse.json(agents)
  } catch (error) {
    console.error("Error fetching agents:", error)
    return NextResponse.json({ error: "Failed to fetch agents" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const sql = neon(process.env.DATABASE_URL!)

  try {
    const body = await request.json()
    const result = createAgentSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: "Invalid request", details: result.error.issues }, { status: 400 })
    }

    const { name, extension, status, department, email } = result.data

    const agents = await sql`
      INSERT INTO agents (name, extension, status, department, email, updated_at)
      VALUES (${name}, ${extension}, ${status}, ${department || null}, ${email || null}, NOW())
      RETURNING id, name, extension, status, department, email, avatar_url, created_at, updated_at
    `

    return NextResponse.json(agents[0], { status: 201 })
  } catch (error) {
    console.error("Failed to create agent:", error)
    return NextResponse.json({ error: "Failed to create agent" }, { status: 500 })
  }
}
