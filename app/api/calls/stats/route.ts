import { neon } from "@neondatabase/serverless"
import { NextResponse } from "next/server"

export async function GET() {
  const sql = neon(process.env.DATABASE_URL!)

  try {
    // Today's KPIs
    const todayStats = await sql`
      SELECT
        COUNT(*) FILTER (WHERE started_at::date = CURRENT_DATE) as calls_today,
        COUNT(*) FILTER (WHERE started_at::date = CURRENT_DATE - 1) as calls_yesterday,
        COUNT(*) FILTER (WHERE started_at::date = CURRENT_DATE AND status = 'missed') as missed_today,
        COUNT(*) FILTER (WHERE started_at::date = CURRENT_DATE - 1 AND status = 'missed') as missed_yesterday,
        COALESCE(AVG(duration) FILTER (WHERE started_at::date = CURRENT_DATE AND status = 'answered'), 0) as avg_duration_today,
        COALESCE(AVG(duration) FILTER (WHERE started_at::date = CURRENT_DATE - 1 AND status = 'answered'), 0) as avg_duration_yesterday
      FROM call_logs
    `

    // Active agents count
    const agentStats = await sql`
      SELECT
        COUNT(*) as total_agents,
        COUNT(*) FILTER (WHERE status = 'online') as active_agents
      FROM agents
    `

    // Call volume by day (last 7 days)
    const volumeByDay = await sql`
      SELECT
        started_at::date as date,
        COUNT(*) FILTER (WHERE direction = 'inbound') as inbound,
        COUNT(*) FILTER (WHERE direction = 'outbound') as outbound,
        COUNT(*) FILTER (WHERE status = 'missed') as missed
      FROM call_logs
      WHERE started_at >= CURRENT_DATE - INTERVAL '6 days'
      GROUP BY started_at::date
      ORDER BY date ASC
    `

    // Status breakdown
    const statusBreakdown = await sql`
      SELECT status, COUNT(*) as count
      FROM call_logs
      WHERE started_at >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY status
      ORDER BY count DESC
    `

    // Recent calls (last 10)
    const recentCalls = await sql`
      SELECT
        cl.id,
        cl.contact_id,
        cl.agent_id,
        cl.direction,
        cl.phone_number,
        cl.status,
        cl.duration,
        cl.started_at,
        cl.ended_at,
        c.name as contact_name,
        a.name as agent_name
      FROM call_logs cl
      LEFT JOIN contacts c ON c.id = cl.contact_id
      LEFT JOIN agents a ON a.id = cl.agent_id
      ORDER BY cl.started_at DESC
      LIMIT 10
    `

    // Agent performance today
    const agentPerformance = await sql`
      SELECT
        a.id as agent_id,
        a.name,
        a.status,
        a.extension,
        a.department,
        COUNT(cl.id) FILTER (WHERE cl.started_at::date = CURRENT_DATE) as calls_today,
        COALESCE(AVG(cl.duration) FILTER (WHERE cl.started_at::date = CURRENT_DATE AND cl.status = 'answered'), 0) as avg_duration_today,
        COUNT(cl.id) FILTER (WHERE cl.started_at >= CURRENT_DATE - INTERVAL '30 days') as calls_30d
      FROM agents a
      LEFT JOIN call_logs cl ON cl.agent_id = a.id
      GROUP BY a.id, a.name, a.status, a.extension, a.department
      ORDER BY calls_today DESC
    `

    const stats = todayStats[0]
    const agents = agentStats[0]

    return NextResponse.json({
      totalCallsToday: parseInt(String(stats.calls_today || 0)),
      totalCallsYesterday: parseInt(String(stats.calls_yesterday || 0)),
      missedCallsToday: parseInt(String(stats.missed_today || 0)),
      missedCallsYesterday: parseInt(String(stats.missed_yesterday || 0)),
      avgHandleTime: Math.round(parseFloat(String(stats.avg_duration_today || 0))),
      avgHandleTimeYesterday: Math.round(parseFloat(String(stats.avg_duration_yesterday || 0))),
      activeAgents: parseInt(String(agents.active_agents || 0)),
      totalAgents: parseInt(String(agents.total_agents || 0)),
      callVolumeByDay: volumeByDay,
      statusBreakdown,
      recentCalls,
      agentPerformance,
    })
  } catch (error) {
    console.error("Failed to fetch stats:", error)
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 })
  }
}
