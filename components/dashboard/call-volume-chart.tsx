"use client"

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import { format, parseISO } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface DayData {
  date: string
  inbound: number
  outbound: number
  missed: number
}

interface CallVolumeChartProps {
  data: DayData[]
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-popover border border-border rounded-xl shadow-lg p-3 text-sm min-w-[140px]">
      <p className="font-semibold text-foreground mb-2">
        {label ? format(parseISO(label), "MMM d, yyyy") : ""}
      </p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-muted-foreground capitalize">{entry.name}</span>
          </div>
          <span className="font-semibold tabular-nums">{entry.value}</span>
        </div>
      ))}
    </div>
  )
}

export function CallVolumeChart({ data }: CallVolumeChartProps) {
  const formattedData = data.map((d) => ({
    ...d,
    label: d.date,
  }))

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Call Volume</CardTitle>
        <p className="text-sm text-muted-foreground">Last 7 days</p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={formattedData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
            <defs>
              <linearGradient id="inboundGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="oklch(0.55 0.22 264)" stopOpacity={0.2} />
                <stop offset="95%" stopColor="oklch(0.55 0.22 264)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="outboundGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="oklch(0.55 0.22 290)" stopOpacity={0.2} />
                <stop offset="95%" stopColor="oklch(0.55 0.22 290)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="missedGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="oklch(0.62 0.23 27)" stopOpacity={0.15} />
                <stop offset="95%" stopColor="oklch(0.62 0.23 27)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.9 0.01 264)" vertical={false} />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: "oklch(0.52 0.03 264)" }}
              tickFormatter={(v) => {
                try { return format(parseISO(v), "MMM d") } catch { return v }
              }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: "oklch(0.52 0.03 264)" }}
              allowDecimals={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
              formatter={(value) => <span style={{ color: "oklch(0.52 0.03 264)", textTransform: "capitalize" }}>{value}</span>}
            />
            <Area
              type="monotone"
              dataKey="inbound"
              name="inbound"
              stroke="oklch(0.55 0.22 264)"
              strokeWidth={2}
              fill="url(#inboundGrad)"
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
            />
            <Area
              type="monotone"
              dataKey="outbound"
              name="outbound"
              stroke="oklch(0.55 0.22 290)"
              strokeWidth={2}
              fill="url(#outboundGrad)"
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
            />
            <Area
              type="monotone"
              dataKey="missed"
              name="missed"
              stroke="oklch(0.62 0.23 27)"
              strokeWidth={1.5}
              strokeDasharray="4 2"
              fill="url(#missedGrad)"
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
