import { neon } from "@neondatabase/serverless"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const sql = neon(process.env.DATABASE_URL!)
  
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get("q") || ""
  
  try {
    let contacts
    
    if (query) {
      // Search by name, phone number, or company
      const searchTerm = `%${query}%`
      contacts = await sql`
        SELECT id, name, phone_number, company, created_at 
        FROM contacts 
        WHERE 
          name ILIKE ${searchTerm} OR 
          phone_number LIKE ${searchTerm} OR 
          company ILIKE ${searchTerm}
        ORDER BY name ASC
        LIMIT 10
      `
    } else {
      // Return all contacts if no search query
      contacts = await sql`
        SELECT id, name, phone_number, company, created_at 
        FROM contacts 
        ORDER BY name ASC
        LIMIT 10
      `
    }
    
    return NextResponse.json(contacts)
  } catch (error) {
    console.error("Failed to fetch contacts:", error)
    return NextResponse.json({ error: "Failed to fetch contacts" }, { status: 500 })
  }
}
