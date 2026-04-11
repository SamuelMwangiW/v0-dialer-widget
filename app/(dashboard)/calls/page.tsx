"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { format, formatDistanceToNow } from "date-fns"
import { toast } from "sonner"
import {
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  Search,
  Filter,
  X,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import type { CallLog } from "@/lib/types"

function formatDuration(seconds: number): string {
  if (!seconds || seconds === 0) return "—"
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, "0")}`
}

const statusConfig: Record<string, { label: string; className: string }> = {
  answered: { label: "Answered", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  missed: { label: "Missed", className: "bg-red-50 text-red-700 border-red-200" },
  voicemail: { label: "Voicemail", className: "bg-amber-50 text-amber-700 border-amber-200" },
  transferred: { label: "Transferred", className: "bg-blue-50 text-blue-700 border-blue-200" },
  declined: { label: "Declined", className: "bg-slate-50 text-slate-600 border-slate-200" },
}

interface Agent {
  id: number
  name: string
}

export default function CallsPage() {
  const [calls, setCalls] = useState<CallLog[]>([])
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Filters
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [directionFilter, setDirectionFilter] = useState("all")
  const [agentFilter, setAgentFilter] = useState("all")

  const hasFilters = search || statusFilter !== "all" || directionFilter !== "all" || agentFilter !== "all"

  const fetchCalls = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: "25" })
      if (search) params.set("q", search)
      if (statusFilter !== "all") params.set("status", statusFilter)
      if (directionFilter !== "all") params.set("direction", directionFilter)
      if (agentFilter !== "all") params.set("agent_id", agentFilter)

      const res = await fetch(`/api/calls?${params}`)
      if (res.ok) {
        const data = await res.json()
        setCalls(data.data || [])
        setTotal(data.total || 0)
        setTotalPages(data.totalPages || 1)
      }
    } catch {
      toast.error("Failed to load calls")
    } finally {
      setLoading(false)
    }
  }, [page, search, statusFilter, directionFilter, agentFilter])

  useEffect(() => {
    fetch("/api/agents")
      .then((r) => r.json())
      .then((data) => setAgents(Array.isArray(data) ? data : []))
      .catch(() => {})
  }, [])

  useEffect(() => {
    const timer = setTimeout(fetchCalls, search ? 400 : 0)
    return () => clearTimeout(timer)
  }, [fetchCalls, search])

  function clearFilters() {
    setSearch("")
    setStatusFilter("all")
    setDirectionFilter("all")
    setAgentFilter("all")
    setPage(1)
  }

  return (
    <div className="space-y-6 max-w-[1400px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Call History</h1>
          <p className="text-muted-foreground text-sm">{total} records</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by contact or phone..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="pl-9"
          />
        </div>

        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="answered">Answered</SelectItem>
            <SelectItem value="missed">Missed</SelectItem>
            <SelectItem value="voicemail">Voicemail</SelectItem>
            <SelectItem value="transferred">Transferred</SelectItem>
            <SelectItem value="declined">Declined</SelectItem>
          </SelectContent>
        </Select>

        <Select value={directionFilter} onValueChange={(v) => { setDirectionFilter(v); setPage(1) }}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Direction" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All directions</SelectItem>
            <SelectItem value="inbound">Inbound</SelectItem>
            <SelectItem value="outbound">Outbound</SelectItem>
          </SelectContent>
        </Select>

        <Select value={agentFilter} onValueChange={(v) => { setAgentFilter(v); setPage(1) }}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Agent" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All agents</SelectItem>
            {agents.map((a) => (
              <SelectItem key={a.id} value={String(a.id)}>{a.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1.5 text-muted-foreground">
            <X className="w-3.5 h-3.5" />
            Clear
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border/60 overflow-hidden bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="w-10"></TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Agent</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Time</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12">
                  <Loader2 className="w-5 h-5 animate-spin mx-auto text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : calls.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                  No calls found
                </TableCell>
              </TableRow>
            ) : (
              calls.map((call) => {
                const sc = statusConfig[call.status] || { label: call.status, className: "" }
                return (
                  <TableRow key={call.id} className="hover:bg-muted/20">
                    <TableCell>
                      <div className="w-7 h-7 rounded-md bg-muted/50 flex items-center justify-center">
                        {call.status === "missed" ? (
                          <PhoneMissed className="w-3.5 h-3.5 text-red-500" />
                        ) : call.direction === "inbound" ? (
                          <PhoneIncoming className="w-3.5 h-3.5 text-[oklch(0.55_0.22_264)]" />
                        ) : (
                          <PhoneOutgoing className="w-3.5 h-3.5 text-[oklch(0.55_0.22_290)]" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {call.contact_id ? (
                        <Link
                          href={`/contacts/${call.contact_id}`}
                          className="font-medium hover:text-primary transition-colors"
                        >
                          {call.contact_name || "Unknown"}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">{call.contact_name || "Unknown"}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">{call.agent_name || "—"}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-mono text-muted-foreground">{call.phone_number}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn("text-xs font-medium border", sc.className)}>
                        {sc.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-mono text-muted-foreground tabular-nums">
                        {formatDuration(Number(call.duration))}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm">{format(new Date(call.started_at), "MMM d, h:mm a")}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(call.started_at), { addSuffix: true })}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Page {page} of {totalPages} · {total} total records</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
              Previous
            </Button>
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
