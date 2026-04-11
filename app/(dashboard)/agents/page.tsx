"use client"

import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Phone, Headphones, Edit, Loader2, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import type { Agent } from "@/lib/types"

const agentSchema = z.object({
  name: z.string().min(1, "Name is required"),
  extension: z.coerce.number().int().positive("Extension must be a positive number"),
  status: z.enum(["online", "busy", "away"]),
  department: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
})

type AgentFormData = z.infer<typeof agentSchema>

const statusConfig = {
  online: { label: "Online", dot: "bg-emerald-500", badge: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  busy: { label: "Busy", dot: "bg-red-500", badge: "bg-red-50 text-red-700 border-red-200" },
  away: { label: "Away", dot: "bg-amber-500", badge: "bg-amber-50 text-amber-700 border-amber-200" },
}

const avatarColors = [
  "bg-[oklch(0.55_0.22_264/0.15)] text-[oklch(0.45_0.22_264)]",
  "bg-[oklch(0.55_0.22_290/0.15)] text-[oklch(0.45_0.22_290)]",
  "bg-[oklch(0.65_0.18_162/0.15)] text-[oklch(0.45_0.18_162)]",
  "bg-[oklch(0.75_0.18_85/0.15)] text-[oklch(0.55_0.18_85)]",
  "bg-[oklch(0.62_0.23_27/0.15)] text-[oklch(0.45_0.23_27)]",
]

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
}

interface AgentWithStats extends Agent {
  calls_today?: number
  avg_duration_today?: number
  calls_30d?: number
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<AgentWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editAgent, setEditAgent] = useState<AgentWithStats | null>(null)
  const [saving, setSaving] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<AgentFormData>({
    resolver: zodResolver(agentSchema),
    defaultValues: { status: "online" },
  })

  const watchedStatus = watch("status")

  const fetchAgents = useCallback(async () => {
    setLoading(true)
    try {
      const [agentsRes, statsRes] = await Promise.all([
        fetch("/api/agents"),
        fetch("/api/calls/stats"),
      ])

      if (!agentsRes.ok) throw new Error("Failed")
      const agentsData = await agentsRes.json()
      let agentPerformance: AgentWithStats[] = []

      if (statsRes.ok) {
        const statsData = await statsRes.json()
        agentPerformance = statsData.agentPerformance || []
      }

      // Merge performance data with agent data
      const merged = (Array.isArray(agentsData) ? agentsData : []).map((agent: Agent) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const perf = (agentPerformance as Array<any>).find((p: any) => p.agent_id === agent.id)
        return { ...agent, ...perf }
      })

      setAgents(merged)
    } catch {
      toast.error("Failed to load agents")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAgents() }, [fetchAgents])

  function openCreate() {
    setEditAgent(null)
    reset({ name: "", extension: undefined, status: "online", department: "", email: "" })
    setSheetOpen(true)
  }

  function openEdit(agent: AgentWithStats) {
    setEditAgent(agent)
    setValue("name", agent.name)
    setValue("extension", agent.extension)
    setValue("status", agent.status)
    setValue("department", agent.department || "")
    setValue("email", agent.email || "")
    setSheetOpen(true)
  }

  async function onSubmit(data: AgentFormData) {
    setSaving(true)
    try {
      const url = editAgent ? `/api/agents/${editAgent.id}` : "/api/agents"
      const method = editAgent ? "PATCH" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!res.ok) throw new Error("Failed")

      toast.success(editAgent ? "Agent updated" : "Agent created")
      setSheetOpen(false)
      fetchAgents()
    } catch {
      toast.error(editAgent ? "Failed to update agent" : "Failed to create agent")
    } finally {
      setSaving(false)
    }
  }

  async function updateStatus(agentId: number, status: string) {
    try {
      const res = await fetch(`/api/agents/${agentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error("Failed")
      setAgents((prev) => prev.map((a) => a.id === agentId ? { ...a, status: status as Agent["status"] } : a))
      toast.success("Status updated")
    } catch {
      toast.error("Failed to update status")
    }
  }

  function formatDuration(seconds: number): string {
    if (!seconds || seconds === 0) return "—"
    const m = Math.floor(seconds / 60)
    const s = Math.round(seconds % 60)
    return `${m}:${String(s).padStart(2, "0")}`
  }

  const onlineCount = agents.filter((a) => a.status === "online").length

  return (
    <div className="space-y-6 max-w-[1400px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Agents</h1>
          <p className="text-muted-foreground text-sm">
            {agents.length} agents · {onlineCount} online
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="w-4 h-4" />
          New Agent
        </Button>
      </div>

      {/* Agent grid */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : agents.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Headphones className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p>No agents yet. Create your first agent!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {agents.map((agent, i) => {
            const sc = statusConfig[agent.status] || statusConfig.away
            const colorClass = avatarColors[i % avatarColors.length]

            return (
              <Card key={agent.id} className="border-border/60 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
                <CardContent className="p-5">
                  {/* Avatar + status */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="relative">
                      <Avatar className="w-12 h-12">
                        <AvatarFallback className={cn("text-sm font-bold", colorClass)}>
                          {getInitials(agent.name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className={cn("absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-card", sc.dot)} />
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 -mr-1 -mt-1"
                      onClick={() => openEdit(agent)}
                    >
                      <Edit className="w-3.5 h-3.5 text-muted-foreground" />
                    </Button>
                  </div>

                  {/* Info */}
                  <div className="mb-3">
                    <h3 className="font-semibold text-sm">{agent.name}</h3>
                    <p className="text-xs text-muted-foreground">{agent.department || "Support"}</p>
                  </div>

                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted/50 rounded-md px-2 py-1">
                      <Phone className="w-3 h-3" />
                      <span className="font-mono">{agent.extension}</span>
                    </div>
                    <Badge variant="outline" className={cn("text-xs border", sc.badge)}>
                      {sc.label}
                    </Badge>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-2 text-center mb-4">
                    <div className="bg-muted/30 rounded-lg p-2">
                      <p className="text-lg font-bold tabular-nums">{Number(agent.calls_today) || 0}</p>
                      <p className="text-[10px] text-muted-foreground">Calls Today</p>
                    </div>
                    <div className="bg-muted/30 rounded-lg p-2">
                      <p className="text-lg font-bold tabular-nums">{formatDuration(Number(agent.avg_duration_today) || 0)}</p>
                      <p className="text-[10px] text-muted-foreground">Avg Duration</p>
                    </div>
                  </div>

                  {/* Quick status change */}
                  <Select value={agent.status} onValueChange={(v) => updateStatus(agent.id, v)}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="online">🟢 Online</SelectItem>
                      <SelectItem value="busy">🔴 Busy</SelectItem>
                      <SelectItem value="away">🟡 Away</SelectItem>
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Create/Edit Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{editAgent ? "Edit Agent" : "New Agent"}</SheetTitle>
          </SheetHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 mt-6">
            <div className="space-y-1.5">
              <Label>Full Name *</Label>
              <Input {...register("name")} placeholder="Sarah Johnson" />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Extension *</Label>
              <Input type="number" {...register("extension")} placeholder="101" />
              {errors.extension && <p className="text-xs text-destructive">{errors.extension.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={watchedStatus} onValueChange={(v) => setValue("status", v as "online" | "busy" | "away")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="online">🟢 Online</SelectItem>
                  <SelectItem value="busy">🔴 Busy</SelectItem>
                  <SelectItem value="away">🟡 Away</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Department</Label>
              <Input {...register("department")} placeholder="Support" />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" {...register("email")} placeholder="agent@callcenter.com" />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
            <SheetFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => setSheetOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editAgent ? "Save Changes" : "Create Agent"}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  )
}
