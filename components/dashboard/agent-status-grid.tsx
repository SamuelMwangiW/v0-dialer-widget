import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

interface AgentPerf {
  agent_id: number
  name: string
  status: "online" | "busy" | "away"
  extension: number
  department?: string
  calls_today: number
  avg_duration_today: number
}

interface AgentStatusGridProps {
  agents: AgentPerf[]
}

const statusConfig = {
  online: { label: "Online", dot: "bg-emerald-500", badge: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  busy: { label: "Busy", dot: "bg-red-500", badge: "bg-red-50 text-red-700 border-red-200" },
  away: { label: "Away", dot: "bg-amber-500", badge: "bg-amber-50 text-amber-700 border-amber-200" },
}

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
}

function formatDuration(seconds: number): string {
  if (!seconds || seconds === 0) return "—"
  const m = Math.floor(seconds / 60)
  const s = Math.round(seconds % 60)
  return `${m}:${String(s).padStart(2, "0")}`
}

const avatarColors = [
  "bg-[oklch(0.55_0.22_264/0.15)] text-[oklch(0.45_0.22_264)]",
  "bg-[oklch(0.55_0.22_290/0.15)] text-[oklch(0.45_0.22_290)]",
  "bg-[oklch(0.65_0.18_162/0.15)] text-[oklch(0.45_0.18_162)]",
  "bg-[oklch(0.75_0.18_85/0.15)] text-[oklch(0.55_0.18_85)]",
  "bg-[oklch(0.62_0.23_27/0.15)] text-[oklch(0.45_0.23_27)]",
]

export function AgentStatusGrid({ agents }: AgentStatusGridProps) {
  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3 flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base font-semibold">Agent Status</CardTitle>
          <p className="text-sm text-muted-foreground mt-0.5">Live availability</p>
        </div>
        <Button variant="ghost" size="sm" asChild className="text-xs text-muted-foreground hover:text-foreground gap-1">
          <Link href="/agents">
            Manage
            <ArrowRight className="w-3 h-3" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        {agents.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">No agents configured</div>
        ) : (
          <div className="divide-y divide-border/40">
            {agents.map((agent, i) => {
              const sc = statusConfig[agent.status] || statusConfig.away
              const colorClass = avatarColors[i % avatarColors.length]

              return (
                <div key={agent.agent_id} className="flex items-center gap-3 px-5 py-3 hover:bg-muted/30 transition-colors">
                  {/* Avatar with status ring */}
                  <div className="relative shrink-0">
                    <Avatar className="w-9 h-9">
                      <AvatarFallback className={cn("text-xs font-bold", colorClass)}>
                        {getInitials(agent.name)}
                      </AvatarFallback>
                    </Avatar>
                    <span
                      className={cn(
                        "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-card",
                        sc.dot
                      )}
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium truncate">{agent.name}</span>
                      <span className="text-xs text-muted-foreground font-mono shrink-0">#{agent.extension}</span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{agent.department || "Support"}</p>
                  </div>

                  {/* Status */}
                  <Badge variant="outline" className={cn("text-xs font-medium border shrink-0", sc.badge)}>
                    {sc.label}
                  </Badge>

                  {/* Calls today */}
                  <div className="text-right shrink-0 hidden sm:block">
                    <p className="text-sm font-semibold tabular-nums">{Number(agent.calls_today) || 0}</p>
                    <p className="text-xs text-muted-foreground">calls</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
