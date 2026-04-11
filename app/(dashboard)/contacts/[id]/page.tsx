"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { toast } from "sonner"
import { formatDistanceToNow, format } from "date-fns"
import {
  ArrowLeft,
  Phone,
  Mail,
  Building2,
  FileText,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  Edit,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import type { Contact, CallLog } from "@/lib/types"

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
}

function formatDuration(seconds: number): string {
  if (seconds === 0) return "—"
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

export default function ContactDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [contact, setContact] = useState<Contact | null>(null)
  const [calls, setCalls] = useState<CallLog[]>([])
  const [totalCalls, setTotalCalls] = useState(0)
  const [loading, setLoading] = useState(true)
  const [editOpen, setEditOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editData, setEditData] = useState({ name: "", phone_number: "", company: "", email: "", notes: "" })

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [contactRes, callsRes] = await Promise.all([
        fetch(`/api/contacts/${id}`),
        fetch(`/api/contacts/${id}/calls?limit=50`),
      ])
      if (!contactRes.ok) {
        router.push("/contacts")
        return
      }
      const contactData = await contactRes.json()
      setContact(contactData)
      setEditData({
        name: contactData.name,
        phone_number: contactData.phone_number,
        company: contactData.company || "",
        email: contactData.email || "",
        notes: contactData.notes || "",
      })
      if (callsRes.ok) {
        const callsData = await callsRes.json()
        setCalls(callsData.data || [])
        setTotalCalls(callsData.total || 0)
      }
    } catch {
      toast.error("Failed to load contact")
    } finally {
      setLoading(false)
    }
  }, [id, router])

  useEffect(() => { fetchData() }, [fetchData])

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch(`/api/contacts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editData),
      })
      if (!res.ok) throw new Error("Failed")
      const updated = await res.json()
      setContact(updated)
      toast.success("Contact updated")
      setEditOpen(false)
    } catch {
      toast.error("Failed to update contact")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!contact) return null

  const answeredCalls = calls.filter((c) => c.status === "answered").length
  const answerRate = totalCalls > 0 ? Math.round((answeredCalls / totalCalls) * 100) : 0
  const avgDuration = answeredCalls > 0
    ? Math.round(calls.filter((c) => c.status === "answered").reduce((s, c) => s + Number(c.duration), 0) / answeredCalls)
    : 0

  return (
    <div className="space-y-6 max-w-[1000px]">
      {/* Back */}
      <Button variant="ghost" size="sm" onClick={() => router.push("/contacts")} className="gap-2 -ml-2 text-muted-foreground">
        <ArrowLeft className="w-4 h-4" />
        Back to Contacts
      </Button>

      {/* Contact card */}
      <Card className="border-border/60">
        <CardContent className="p-6">
          <div className="flex items-start gap-5">
            <Avatar className="w-16 h-16">
              <AvatarFallback className="text-xl font-bold bg-[oklch(0.55_0.22_264/0.12)] text-[oklch(0.45_0.22_264)]">
                {getInitials(contact.name)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">{contact.name}</h1>
                  {contact.company && (
                    <div className="flex items-center gap-1.5 text-muted-foreground mt-1">
                      <Building2 className="w-4 h-4" />
                      <span>{contact.company}</span>
                    </div>
                  )}
                </div>
                <Button variant="outline" size="sm" onClick={() => setEditOpen(true)} className="gap-2 shrink-0">
                  <Edit className="w-3.5 h-3.5" />
                  Edit
                </Button>
              </div>

              <div className="flex flex-wrap gap-4 mt-4">
                <div className="flex items-center gap-1.5 text-sm">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span className="font-mono">{contact.phone_number}</span>
                </div>
                {contact.email && (
                  <div className="flex items-center gap-1.5 text-sm">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span>{contact.email}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {contact.notes && (
            <>
              <Separator className="my-5" />
              <div className="flex gap-3">
                <FileText className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                <p className="text-sm text-muted-foreground leading-relaxed">{contact.notes}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-border/60">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold tabular-nums">{totalCalls}</p>
            <p className="text-xs text-muted-foreground mt-1">Total Calls</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold tabular-nums">{answerRate}%</p>
            <p className="text-xs text-muted-foreground mt-1">Answer Rate</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold tabular-nums">{formatDuration(avgDuration)}</p>
            <p className="text-xs text-muted-foreground mt-1">Avg Duration</p>
          </CardContent>
        </Card>
      </div>

      {/* Call history */}
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Call History</CardTitle>
          <p className="text-sm text-muted-foreground">{totalCalls} calls recorded</p>
        </CardHeader>
        <CardContent className="p-0">
          {calls.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">No calls yet</div>
          ) : (
            <div className="divide-y divide-border/40">
              {calls.map((call) => {
                const sc = statusConfig[call.status] || { label: call.status, className: "" }
                return (
                  <div key={call.id} className="flex items-center gap-3 px-6 py-3.5 hover:bg-muted/20 transition-colors">
                    <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center shrink-0">
                      {call.status === "missed" ? (
                        <PhoneMissed className="w-4 h-4 text-red-500" />
                      ) : call.direction === "inbound" ? (
                        <PhoneIncoming className="w-4 h-4 text-[oklch(0.55_0.22_264)]" />
                      ) : (
                        <PhoneOutgoing className="w-4 h-4 text-[oklch(0.55_0.22_290)]" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm capitalize text-muted-foreground">{call.direction}</span>
                        {call.agent_name && (
                          <>
                            <span className="text-muted-foreground/40">·</span>
                            <span className="text-sm text-muted-foreground">{call.agent_name}</span>
                          </>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground/60">
                        {format(new Date(call.started_at), "MMM d, yyyy · h:mm a")}
                      </p>
                    </div>

                    <Badge variant="outline" className={cn("text-xs shrink-0", sc.className)}>
                      {sc.label}
                    </Badge>

                    <span className="text-xs font-mono text-muted-foreground w-12 text-right shrink-0">
                      {formatDuration(Number(call.duration))}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Sheet */}
      <Sheet open={editOpen} onOpenChange={setEditOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Edit Contact</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-4 mt-6">
            <div className="space-y-1.5">
              <Label>Full Name</Label>
              <Input value={editData.name} onChange={(e) => setEditData({ ...editData, name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Phone Number</Label>
              <Input value={editData.phone_number} onChange={(e) => setEditData({ ...editData, phone_number: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Company</Label>
              <Input value={editData.company} onChange={(e) => setEditData({ ...editData, company: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" value={editData.email} onChange={(e) => setEditData({ ...editData, email: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea value={editData.notes} onChange={(e) => setEditData({ ...editData, notes: e.target.value })} rows={4} />
            </div>
          </div>
          <SheetFooter className="mt-6">
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}
