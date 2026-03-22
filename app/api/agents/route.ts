import { neon } from "@neondatabase/serverless"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const sql = neon(process.env.DATABASE_URL!)
    
    const agents = await sql`
      SELECT id, name, extension, status, created_at 
      FROM agents 
      ORDER BY name ASC
    `
    
    return NextResponse.json(agents)
  } catch (error) {
    console.error("Error fetching agents:", error)
    return NextResponse.json(
      { error: "Failed to fetch agents" },
      { status: 500 }
    )
  }
}
