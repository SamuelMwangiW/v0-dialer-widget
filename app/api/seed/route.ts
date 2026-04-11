import { neon } from "@neondatabase/serverless"
import { NextRequest, NextResponse } from "next/server"
import { hashPassword } from "@/lib/auth"

export async function POST(request: NextRequest) {
  // Protect the seed endpoint
  const secret = request.headers.get("x-seed-secret")
  if (process.env.SEED_SECRET && secret !== process.env.SEED_SECRET) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const sql = neon(process.env.DATABASE_URL!)

  try {
    // 1. Create users table
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'admin',
        avatar_url TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `

    // 2. Create contacts table
    await sql`
      CREATE TABLE IF NOT EXISTS contacts (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        phone_number TEXT NOT NULL,
        company TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `

    // 3. Migrate contacts
    await sql`ALTER TABLE contacts ADD COLUMN IF NOT EXISTS email TEXT`
    await sql`ALTER TABLE contacts ADD COLUMN IF NOT EXISTS notes TEXT`
    await sql`ALTER TABLE contacts ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW()`

    // 4. Create agents table
    await sql`
      CREATE TABLE IF NOT EXISTS agents (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        extension INT NOT NULL,
        status TEXT DEFAULT 'online',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `

    // 5. Migrate agents
    await sql`ALTER TABLE agents ADD COLUMN IF NOT EXISTS email TEXT`
    await sql`ALTER TABLE agents ADD COLUMN IF NOT EXISTS department TEXT`
    await sql`ALTER TABLE agents ADD COLUMN IF NOT EXISTS avatar_url TEXT`
    await sql`ALTER TABLE agents ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW()`

    // 6. Create call_logs table
    await sql`
      CREATE TABLE IF NOT EXISTS call_logs (
        id SERIAL PRIMARY KEY,
        contact_id INTEGER REFERENCES contacts(id) ON DELETE SET NULL,
        agent_id INTEGER REFERENCES agents(id) ON DELETE SET NULL,
        direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
        phone_number TEXT NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('answered', 'missed', 'declined', 'voicemail', 'transferred')),
        duration INTEGER DEFAULT 0,
        notes TEXT,
        started_at TIMESTAMP DEFAULT NOW(),
        ended_at TIMESTAMP
      )
    `

    // 7. Seed contacts
    await sql`
      INSERT INTO contacts (name, phone_number, company) VALUES
        ('John Smith', '5551234567', 'Acme Corp'),
        ('Jane Doe', '5559876543', 'Tech Solutions'),
        ('Michael Johnson', '5554567890', 'Global Inc'),
        ('Sarah Williams', '5551112222', 'StartUp Labs'),
        ('David Brown', '5553334444', 'Design Studio'),
        ('Emily Davis', '5555556666', 'Marketing Pro'),
        ('Robert Wilson', '5557778888', 'Finance Group'),
        ('Lisa Anderson', '5559990000', 'Health Plus')
      ON CONFLICT DO NOTHING
    `

    // 8. Seed agents
    await sql`
      INSERT INTO agents (name, extension, status, department) VALUES
        ('Sarah Johnson', 101, 'online', 'Support'),
        ('Michael Chen', 102, 'online', 'Sales'),
        ('Emily Davis', 103, 'busy', 'Support'),
        ('David Wilson', 104, 'online', 'Technical'),
        ('Jessica Brown', 105, 'away', 'Sales')
      ON CONFLICT DO NOTHING
    `

    // 9. Seed admin user
    const passwordHash = await hashPassword("admin123")
    await sql`
      INSERT INTO users (name, email, password_hash, role)
      VALUES ('Admin User', 'admin@callcenter.com', ${passwordHash}, 'admin')
      ON CONFLICT (email) DO NOTHING
    `

    // 10. Seed call logs (get contact and agent IDs first)
    const contacts = await sql`SELECT id FROM contacts ORDER BY id LIMIT 8`
    const agents = await sql`SELECT id FROM agents ORDER BY id LIMIT 5`

    if (contacts.length === 0 || agents.length === 0) {
      return NextResponse.json({ error: "No contacts or agents found to seed calls" }, { status: 400 })
    }

    const contactIds = contacts.map((c) => c.id)
    const agentIds = agents.map((a) => a.id)

    const statuses = ["answered", "answered", "answered", "answered", "missed", "missed", "voicemail", "transferred", "declined"]
    const directions = ["inbound", "inbound", "inbound", "outbound", "outbound"]

    type CallRecord = {
      contact_id: number | null
      agent_id: number
      direction: string
      phone_number: string
      status: string
      duration: number
      started_at: Date
      ended_at: Date | null
    }

    const callRecords: CallRecord[] = []
    const now = new Date()

    for (let i = 0; i < 130; i++) {
      const daysAgo = Math.floor(Math.random() * 30)
      const hoursAgo = Math.floor(Math.random() * 12) + 8 // business hours offset
      const startedAt = new Date(now.getTime() - daysAgo * 86400000 - hoursAgo * 3600000)
      const status = statuses[Math.floor(Math.random() * statuses.length)]
      const direction = directions[Math.floor(Math.random() * directions.length)]
      const duration = status === "answered" ? Math.floor(Math.random() * 570) + 30
        : status === "voicemail" ? Math.floor(Math.random() * 60) + 20
        : 0
      const endedAt = duration > 0 ? new Date(startedAt.getTime() + duration * 1000) : null
      const hasContact = Math.random() > 0.2
      const contactId = hasContact ? contactIds[Math.floor(Math.random() * contactIds.length)] : null
      const agentId = agentIds[Math.floor(Math.random() * agentIds.length)]
      const phoneNumber = contactId
        ? `555${String(Math.floor(Math.random() * 9000000) + 1000000)}`
        : `555${String(Math.floor(Math.random() * 9000000) + 1000000)}`

      callRecords.push({
        contact_id: contactId,
        agent_id: agentId,
        direction,
        phone_number: phoneNumber,
        status,
        duration,
        started_at: startedAt,
        ended_at: endedAt,
      })
    }

    // Insert in batches of 25
    for (let i = 0; i < callRecords.length; i += 25) {
      const batch = callRecords.slice(i, i + 25)
      for (const record of batch) {
        await sql`
          INSERT INTO call_logs (contact_id, agent_id, direction, phone_number, status, duration, started_at, ended_at)
          VALUES (${record.contact_id}, ${record.agent_id}, ${record.direction}, ${record.phone_number}, ${record.status}, ${record.duration}, ${record.started_at}, ${record.ended_at})
        `
      }
    }

    return NextResponse.json({
      ok: true,
      message: `Database seeded successfully. Created ${callRecords.length} call log records.`,
      summary: {
        contacts: contactIds.length,
        agents: agentIds.length,
        callLogs: callRecords.length,
      },
    })
  } catch (error) {
    console.error("Seed error:", error)
    return NextResponse.json(
      { error: "Seed failed", details: String(error) },
      { status: 500 }
    )
  }
}
