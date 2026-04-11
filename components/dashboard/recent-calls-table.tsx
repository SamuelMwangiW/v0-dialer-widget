"use client"

import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import {
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  PhoneForwarded,
  Voicemail,
  PhoneOff,
  ArrowRight,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { CallLog } from "@/lib/types"

function formatDuration(seconds: number): string {
  if (seconds === 0) return "—"
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, "0")}`
}

function DirectionIcon({ direction, status }: { direction: string; status: string }) {
  if (status === "missed") {
    return <PhoneMissed className="w-4 h-4 text-red-500" />
  }
  if (direction === "inbound") {
    return <PhoneIncoming className="w-4 h-4 text-[oklch(0.55_0.22_264)]" />
  }
  return <PhoneOutgoing className="w-4 h-4 text-[oklch(0.55_0.22_290)]" />
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string }> = {
    answered: { label: "Answered", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    missed: { label: "Missed", className: "bg-red-50 text-red-700 border-red-200" },
    voicemail: { label: "Voicemail", className: "bg-amber-50 text-amber-700 border-amber-200" },
    transferred: { label: "Transferred", className: "bg-blue-50 text-blue-700 border-blue-200" },
    declined: { label: "Declined", className: "bg-slate-50 text-slate-600 border-slate-200" },
  }

  const c = config[status] || { label: status, className: "bg-muted text-muted-foreground" }

  return (
    <Badge variant="outline" className={cn("text-xs font-medium border", c.className)}>
      {c.label}
    </Badge>
  )
}

interface RecentCallsTableProps {
  calls: CallLog[]
}

export function RecentCallsTable({ calls }: RecentCallsTableProps) {
  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3 flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base font-semibold">Recent Calls</CardTitle>
          <p className="text-sm text-muted-foreground mt-0.5">Latest activity</p>
        </div>
        <Button variant="ghost" size="sm" asChild className="text-xs text-muted-foreground hover:text-foreground gap-1">
          <Link href="/calls">
            View all
            <ArrowRight className="w-3 h-3" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        {calls.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">No calls yet</div>
        ) : (
          <div className="divide-y divide-border/40">
            {calls.map((call) => (
              <div
                key={call.id}
                className="flex items-center gap-3 px-5 py-3 hover:bg-muted/30 transition-colors"
              >
                {/* Direction icon */}
                <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center shrink-0">
                  <DirectionIcon direction={call.direction} status={call.status} />
                </div>

                {/* Contact info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {call.contact_id ? (
                      <Link
                        href={`/contacts/${call.contact_id}`}
                        className="text-sm font-medium text-foreground hover:text-primary truncate"
                      >
                        {call.contact_name || "Unknown"}
                      </Link>
                    ) : (
                      <span className="text-sm font-medium text-foreground truncate">
                        {call.contact_name || "Unknown"}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground font-mono">{call.phone_number}</p>
                </div>

                {/* Agent */}
                <div className="hidden sm:block min-w-0 flex-shrink-0 w-24">
                  <p className="text-xs text-muted-foreground truncate">{call.agent_name || "—"}</p>
                </div>

                {/* Status */}
                <div className="shrink-0">
                  <StatusBadge status={call.status} />
                </div>

                {/* Duration */}
                <div className="shrink-0 w-12 text-right">
                  <span className="text-xs font-mono text-muted-foreground">
                    {formatDuration(Number(call.duration))}
                  </span>
                </div>

                {/* Time */}
                <div className="shrink-0 w-20 text-right hidden md:block">
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(call.started_at), { addSuffix: true })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
