import { neon } from "@neondatabase/serverless"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

const createContactSchema = z.object({
  name: z.string().min(1),
  phone_number: z.string().min(1),
  company: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  notes: z.string().optional(),
})

export async function GET(request: NextRequest) {
  const sql = neon(process.env.DATABASE_URL!)

  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get("q") || searchParams.get("search") || ""
  const random = searchParams.get("random")
  const page = parseInt(searchParams.get("page") || "1")
  const limit = parseInt(searchParams.get("limit") || "20")
  const offset = (page - 1) * limit

  try {
    if (random === "true") {
      const randomContact = await sql`
        SELECT id, name, phone_number, company, email, notes, created_at, updated_at
        FROM contacts
        ORDER BY RANDOM()
        LIMIT 1
      `
      return NextResponse.json(randomContact[0] || null)
    }

    let contacts
    let countResult

    if (query) {
      const searchTerm = `%${query}%`
      contacts = await sql`
        SELECT id, name, phone_number, company, email, notes, created_at, updated_at
        FROM contacts
        WHERE
          name ILIKE ${searchTerm} OR
          phone_number LIKE ${searchTerm} OR
          company ILIKE ${searchTerm} OR
          email ILIKE ${searchTerm}
        ORDER BY name ASC
        LIMIT ${limit} OFFSET ${offset}
      `
      countResult = await sql`
        SELECT COUNT(*) as total FROM contacts
        WHERE
          name ILIKE ${searchTerm} OR
          phone_number LIKE ${searchTerm} OR
          company ILIKE ${searchTerm} OR
          email ILIKE ${searchTerm}
      `
    } else {
      contacts = await sql`
        SELECT id, name, phone_number, company, email, notes, created_at, updated_at
        FROM contacts
        ORDER BY name ASC
        LIMIT ${limit} OFFSET ${offset}
      `
      countResult = await sql`SELECT COUNT(*) as total FROM contacts`
    }

    const total = parseInt(String(countResult[0]?.total || "0"))

    return NextResponse.json({
      data: contacts,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error("Failed to fetch contacts:", error)
    return NextResponse.json({ error: "Failed to fetch contacts" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const sql = neon(process.env.DATABASE_URL!)

  try {
    const body = await request.json()
    const result = createContactSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: "Invalid request", details: result.error.issues }, { status: 400 })
    }

    const { name, phone_number, company, email, notes } = result.data

    const contacts = await sql`
      INSERT INTO contacts (name, phone_number, company, email, notes, updated_at)
      VALUES (${name}, ${phone_number}, ${company || null}, ${email || null}, ${notes || null}, NOW())
      RETURNING id, name, phone_number, company, email, notes, created_at, updated_at
    `

    return NextResponse.json(contacts[0], { status: 201 })
  } catch (error) {
    console.error("Failed to create contact:", error)
    return NextResponse.json({ error: "Failed to create contact" }, { status: 500 })
  }
}
