"use client"

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface StatusData {
  status: string
  count: number
}

interface StatusDonutProps {
  data: StatusData[]
}

const STATUS_COLORS: Record<string, string> = {
  answered: "oklch(0.65 0.18 162)",
  missed: "oklch(0.62 0.23 27)",
  voicemail: "oklch(0.75 0.18 85)",
  transferred: "oklch(0.55 0.22 264)",
  declined: "oklch(0.52 0.03 264)",
}

const STATUS_LABELS: Record<string, string> = {
  answered: "Answered",
  missed: "Missed",
  voicemail: "Voicemail",
  transferred: "Transferred",
  declined: "Declined",
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number }> }) {
  if (!active || !payload?.length) return null
  const item = payload[0]
  return (
    <div className="bg-popover border border-border rounded-xl shadow-lg p-2.5 text-sm">
      <p className="font-semibold capitalize">{STATUS_LABELS[item.name] || item.name}</p>
      <p className="text-muted-foreground tabular-nums">{item.value} calls</p>
    </div>
  )
}

export function StatusDonut({ data }: StatusDonutProps) {
  const total = data.reduce((sum, d) => sum + Number(d.count), 0)
  const chartData = data.map((d) => ({ ...d, count: Number(d.count) }))

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Call Outcomes</CardTitle>
        <p className="text-sm text-muted-foreground">Last 30 days</p>
      </CardHeader>
      <CardContent>
        <div className="relative h-[160px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                dataKey="count"
                nameKey="status"
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={72}
                strokeWidth={2}
                stroke="var(--card)"
              >
                {chartData.map((entry) => (
                  <Cell
                    key={entry.status}
                    fill={STATUS_COLORS[entry.status] || "oklch(0.52 0.03 264)"}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          {/* Center total */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-2xl font-bold tabular-nums">{total}</span>
            <span className="text-xs text-muted-foreground">total</span>
          </div>
        </div>

        {/* Legend */}
        <div className="space-y-2 mt-3">
          {chartData.map((entry) => (
            <div key={entry.status} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: STATUS_COLORS[entry.status] || "oklch(0.52 0.03 264)" }}
                />
                <span className="text-muted-foreground">{STATUS_LABELS[entry.status] || entry.status}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold tabular-nums">{entry.count}</span>
                <span className="text-muted-foreground/60 text-xs w-10 text-right tabular-nums">
                  {total > 0 ? Math.round((entry.count / total) * 100) : 0}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
