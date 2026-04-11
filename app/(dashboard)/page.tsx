import { sql } from "@/lib/db"
import { format } from "date-fns"
import { PhoneCall, Users, Clock, PhoneMissed } from "lucide-react"
import { KpiCard } from "@/components/dashboard/kpi-card"
import { CallVolumeChart } from "@/components/dashboard/call-volume-chart"
import { StatusDonut } from "@/components/dashboard/status-donut"
import { RecentCallsTable } from "@/components/dashboard/recent-calls-table"
import { AgentStatusGrid } from "@/components/dashboard/agent-status-grid"
import type { CallLog } from "@/lib/types"

async function getDashboardStats() {
  try {
    const [todayStats, agentStats, volumeByDay, statusBreakdown, recentCalls, agentPerformance] =
      await Promise.all([
        sql`
          SELECT
            COUNT(*) FILTER (WHERE started_at::date = CURRENT_DATE) as calls_today,
            COUNT(*) FILTER (WHERE started_at::date = CURRENT_DATE - 1) as calls_yesterday,
            COUNT(*) FILTER (WHERE started_at::date = CURRENT_DATE AND status = 'missed') as missed_today,
            COUNT(*) FILTER (WHERE started_at::date = CURRENT_DATE - 1 AND status = 'missed') as missed_yesterday,
            COALESCE(AVG(duration) FILTER (WHERE started_at::date = CURRENT_DATE AND status = 'answered'), 0) as avg_today,
            COALESCE(AVG(duration) FILTER (WHERE started_at::date = CURRENT_DATE - 1 AND status = 'answered'), 0) as avg_yesterday
          FROM call_logs
        `,
        sql`
          SELECT
            COUNT(*) as total_agents,
            COUNT(*) FILTER (WHERE status = 'online') as active_agents
          FROM agents
        `,
        sql`
          SELECT
            started_at::date::text as date,
            COUNT(*) FILTER (WHERE direction = 'inbound') as inbound,
            COUNT(*) FILTER (WHERE direction = 'outbound') as outbound,
            COUNT(*) FILTER (WHERE status = 'missed') as missed
          FROM call_logs
          WHERE started_at >= CURRENT_DATE - INTERVAL '6 days'
          GROUP BY started_at::date
          ORDER BY date ASC
        `,
        sql`
          SELECT status, COUNT(*) as count
          FROM call_logs
          WHERE started_at >= CURRENT_DATE - INTERVAL '30 days'
          GROUP BY status
          ORDER BY count DESC
        `,
        sql`
          SELECT
            cl.id, cl.contact_id, cl.agent_id, cl.direction,
            cl.phone_number, cl.status, cl.duration, cl.notes,
            cl.started_at, cl.ended_at,
            c.name as contact_name, a.name as agent_name
          FROM call_logs cl
          LEFT JOIN contacts c ON c.id = cl.contact_id
          LEFT JOIN agents a ON a.id = cl.agent_id
          ORDER BY cl.started_at DESC
          LIMIT 10
        `,
        sql`
          SELECT
            a.id as agent_id, a.name, a.status, a.extension, a.department,
            COUNT(cl.id) FILTER (WHERE cl.started_at::date = CURRENT_DATE) as calls_today,
            COALESCE(AVG(cl.duration) FILTER (WHERE cl.started_at::date = CURRENT_DATE AND cl.status = 'answered'), 0) as avg_duration_today,
            COUNT(cl.id) FILTER (WHERE cl.started_at >= CURRENT_DATE - INTERVAL '30 days') as calls_30d
          FROM agents a
          LEFT JOIN call_logs cl ON cl.agent_id = a.id
          GROUP BY a.id, a.name, a.status, a.extension, a.department
          ORDER BY calls_today DESC
        `,
      ])

    return {
      todayStats: todayStats[0],
      agentStats: agentStats[0],
      volumeByDay,
      statusBreakdown,
      recentCalls: recentCalls as CallLog[],
      agentPerformance,
    }
  } catch {
    return null
  }
}

function calcTrend(current: number, previous: number): number | undefined {
  if (!previous) return undefined
  return Math.round(((current - previous) / previous) * 100)
}

function formatAvgTime(seconds: number): string {
  if (!seconds) return "0:00"
  const m = Math.floor(seconds / 60)
  const s = Math.round(seconds % 60)
  return `${m}:${String(s).padStart(2, "0")}`
}

export default async function DashboardPage() {
  const stats = await getDashboardStats()

  const today = format(new Date(), "EEEE, MMMM d, yyyy")

  if (!stats) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Overview</h1>
          <p className="text-muted-foreground text-sm">{today}</p>
        </div>
        <div className="rounded-xl border border-border/60 bg-muted/30 p-8 text-center">
          <p className="text-muted-foreground">
            Database not yet seeded.{" "}
            <a href="/api/seed" className="text-primary underline">
              Run the seeder
            </a>{" "}
            to get started.
          </p>
        </div>
      </div>
    )
  }

  const { todayStats, agentStats, volumeByDay, statusBreakdown, recentCalls, agentPerformance } = stats

  const callsToday = parseInt(String(todayStats.calls_today || 0))
  const callsYesterday = parseInt(String(todayStats.calls_yesterday || 0))
  const missedToday = parseInt(String(todayStats.missed_today || 0))
  const missedYesterday = parseInt(String(todayStats.missed_yesterday || 0))
  const avgToday = parseFloat(String(todayStats.avg_today || 0))
  const avgYesterday = parseFloat(String(todayStats.avg_yesterday || 0))
  const activeAgents = parseInt(String(agentStats.active_agents || 0))
  const totalAgents = parseInt(String(agentStats.total_agents || 0))

  const missedRate = callsToday > 0 ? Math.round((missedToday / callsToday) * 100) : 0
  const missedRateYesterday = callsYesterday > 0 ? Math.round((missedYesterday / callsYesterday) * 100) : 0

  return (
    <div className="space-y-6 max-w-[1400px]">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Overview</h1>
        <p className="text-muted-foreground text-sm">{today}</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Total Calls Today"
          value={callsToday}
          icon={PhoneCall}
          variant="indigo"
          trend={calcTrend(callsToday, callsYesterday)}
          trendLabel="vs. yesterday"
        />
        <KpiCard
          title="Active Agents"
          value={`${activeAgents}/${totalAgents}`}
          icon={Users}
          variant="green"
          subtitle="Currently online"
        />
        <KpiCard
          title="Avg Handle Time"
          value={formatAvgTime(avgToday)}
          icon={Clock}
          variant="amber"
          trend={avgYesterday > 0 ? Math.round(((avgToday - avgYesterday) / avgYesterday) * -100) : undefined}
          trendLabel="vs. yesterday"
        />
        <KpiCard
          title="Missed Call Rate"
          value={`${missedRate}%`}
          icon={PhoneMissed}
          variant="red"
          trend={missedRateYesterday > 0 ? Math.round(((missedRate - missedRateYesterday) / missedRateYesterday) * -100) : undefined}
          trendLabel={`${missedToday} calls missed`}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <CallVolumeChart data={volumeByDay as Array<{ date: string; inbound: number; outbound: number; missed: number }>} />
        </div>
        <div>
          <StatusDonut data={statusBreakdown as Array<{ status: string; count: number }>} />
        </div>
      </div>

      {/* Tables row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <RecentCallsTable calls={recentCalls} />
        </div>
        <div>
          <AgentStatusGrid agents={agentPerformance as Array<{
            agent_id: number
            name: string
            status: "online" | "busy" | "away"
            extension: number
            department?: string
            calls_today: number
            avg_duration_today: number
          }>} />
        </div>
      </div>
    </div>
  )
}
