import { neon } from "@neondatabase/serverless"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

const updateContactSchema = z.object({
  name: z.string().min(1).optional(),
  phone_number: z.string().min(1).optional(),
  company: z.string().optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal("")),
  notes: z.string().optional().nullable(),
})

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const sql = neon(process.env.DATABASE_URL!)
  const { id } = await params

  try {
    const contacts = await sql`
      SELECT id, name, phone_number, company, email, notes, created_at, updated_at
      FROM contacts
      WHERE id = ${id}
      LIMIT 1
    `
    if (!contacts[0]) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 })
    }
    return NextResponse.json(contacts[0])
  } catch (error) {
    console.error("Failed to fetch contact:", error)
    return NextResponse.json({ error: "Failed to fetch contact" }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const sql = neon(process.env.DATABASE_URL!)
  const { id } = await params

  try {
    // First fetch current contact
    const existing = await sql`SELECT * FROM contacts WHERE id = ${id} LIMIT 1`
    if (!existing[0]) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 })
    }

    const body = await request.json()
    const result = updateContactSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: "Invalid request", details: result.error.issues }, { status: 400 })
    }

    const data = result.data
    const current = existing[0]

    const name = data.name ?? current.name
    const phone_number = data.phone_number ?? current.phone_number
    const company = data.company !== undefined ? (data.company || null) : current.company
    const email = data.email !== undefined ? (data.email || null) : current.email
    const notes = data.notes !== undefined ? (data.notes || null) : current.notes

    const contacts = await sql`
      UPDATE contacts SET
        name = ${name},
        phone_number = ${phone_number},
        company = ${company},
        email = ${email},
        notes = ${notes},
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING id, name, phone_number, company, email, notes, created_at, updated_at
    `
    return NextResponse.json(contacts[0])
  } catch (error) {
    console.error("Failed to update contact:", error)
    return NextResponse.json({ error: "Failed to update contact" }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const sql = neon(process.env.DATABASE_URL!)
  const { id } = await params

  try {
    await sql`DELETE FROM contacts WHERE id = ${id}`
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Failed to delete contact:", error)
    return NextResponse.json({ error: "Failed to delete contact" }, { status: 500 })
  }
}
