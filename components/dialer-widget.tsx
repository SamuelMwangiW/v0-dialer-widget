"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Phone, X, Delete, PhoneCall, PhoneOff, PhoneForwarded, Grid3X3, User, ArrowLeft, CheckCircle2, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type CallState = "idle" | "ringing" | "ongoing" | "transferring"

interface CallerInfo {
  name: string
  phoneNumber: string
}

interface Contact {
  id: number
  name: string
  phone_number: string
  company?: string
}

const dialPadButtons = [
  { digit: "1", letters: "" },
  { digit: "2", letters: "ABC" },
  { digit: "3", letters: "DEF" },
  { digit: "4", letters: "GHI" },
  { digit: "5", letters: "JKL" },
  { digit: "6", letters: "MNO" },
  { digit: "7", letters: "PQRS" },
  { digit: "8", letters: "TUV" },
  { digit: "9", letters: "WXYZ" },
  { digit: "*", letters: "" },
  { digit: "0", letters: "+" },
  { digit: "#", letters: "" },
]

// Mock caller data for demonstration
const mockCaller: CallerInfo = {
  name: "John Smith",
  phoneNumber: "(555) 123-4567",
}

interface Agent {
  id: number
  name: string
  extension: number
  status: "online" | "busy" | "away"
  created_at?: string
}

export function DialerWidget() {
  const [isExpanded, setIsExpanded] = useState(false)
  const [contactName, setContactName] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [callState, setCallState] = useState<CallState>("idle")
  const [caller, setCaller] = useState<CallerInfo>(mockCaller)
  const [callDuration, setCallDuration] = useState(0)
  const [showDtmfPad, setShowDtmfPad] = useState(false)
  const [dtmfInput, setDtmfInput] = useState("")
  const [showTransferPanel, setShowTransferPanel] = useState(false)
  const [transferringTo, setTransferringTo] = useState<Agent | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [showSuggestions, setShowSuggestions] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const [agents, setAgents] = useState<Agent[]>([])
  const [agentsLoading, setAgentsLoading] = useState(false)
  const [contacts, setContacts] = useState<Contact[]>([])
  const [contactsLoading, setContactsLoading] = useState(false)

  // Fetch agents from the database
  useEffect(() => {
    const fetchAgents = async () => {
      setAgentsLoading(true)
      try {
        const response = await fetch("/api/agents")
        if (response.ok) {
          const data = await response.json()
          setAgents(data)
        }
      } catch (error) {
        console.error("Failed to fetch agents:", error)
      } finally {
        setAgentsLoading(false)
      }
    }
    fetchAgents()
  }, [])

  // Fetch contacts from the database based on search query
  useEffect(() => {
    const fetchContacts = async () => {
      if (!searchQuery || searchQuery.length < 1) {
        setContacts([])
        return
      }
      setContactsLoading(true)
      try {
        const response = await fetch(`/api/contacts?search=${encodeURIComponent(searchQuery)}`)
        if (response.ok) {
          const data = await response.json()
          setContacts(data)
        }
      } catch (error) {
        console.error("Failed to fetch contacts:", error)
      } finally {
        setContactsLoading(false)
      }
    }
    
    // Debounce the search
    const timeoutId = setTimeout(fetchContacts, 300)
    return () => clearTimeout(timeoutId)
  }, [searchQuery])

  

  // Call duration timer
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    if (callState === "ongoing") {
      interval = setInterval(() => {
        setCallDuration((prev) => prev + 1)
      }, 1000)
    } else {
      setCallDuration(0)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [callState])

  const formatDuration = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }, [])

  const handleDigitPress = (digit: string) => {
    if (callState === "ongoing" && showDtmfPad) {
      setDtmfInput((prev) => prev + digit)
      // In a real app, you would send DTMF tones here
    } else {
      setPhoneNumber((prev) => prev + digit)
    }
  }

  const handleDelete = () => {
    if (callState === "ongoing" && showDtmfPad) {
      setDtmfInput((prev) => prev.slice(0, -1))
    } else {
      setPhoneNumber((prev) => prev.slice(0, -1))
    }
  }

  const handleCall = () => {
    if (phoneNumber) {
      setCaller({ name: contactName ?? "Outgoing Call", phoneNumber: formatPhoneNumber(phoneNumber) })
      setCallState("ongoing")
    }
  }

  const handleAnswer = () => {
    setCallState("ongoing")
    setShowDtmfPad(false)
    setShowTransferPanel(false)
    setDtmfInput("")
  }

  const handleDecline = () => {
    setCallState("idle")
    setShowDtmfPad(false)
    setShowTransferPanel(false)
    setDtmfInput("")
  }

  const handleHangup = () => {
    setCallState("idle")
    setShowDtmfPad(false)
    setShowTransferPanel(false)
    setDtmfInput("")
    setCallDuration(0)
  }

  const handleTransfer = () => {
    setShowTransferPanel(true)
    setShowDtmfPad(false)
  }

  const handleTransferToAgent = (agent: Agent) => {
    setTransferringTo(agent)
    setCallState("transferring")
    setShowTransferPanel(false)
    
    // Simulate transfer completion after 2 seconds
    setTimeout(() => {
      setCallState("idle")
      setTransferringTo(null)
      setCallDuration(0)
      setDtmfInput("")
    }, 2000)
  }

  const getStatusColor = (status: Agent["status"]) => {
    switch (status) {
      case "online":
        return "bg-emerald-500"
      case "busy":
        return "bg-red-500"
      case "away":
        return "bg-amber-500"
    }
  }

  const formatPhoneNumber = (number: string) => {
    const cleaned = number.replace(/\D/g, "")
    if (cleaned.length <= 3) return cleaned
    if (cleaned.length <= 6) return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`
  }

  const handleSelectContact = (contact: Contact) => {
    setPhoneNumber(contact.phone_number)
    setSearchQuery("")
    setShowSuggestions(false)
    setContactName(contact.name)
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchQuery(value)
    // Also update phone number if typing digits
    const digitsOnly = value.replace(/\D/g, "")
    if (digitsOnly || value.length === 0) {
      setPhoneNumber(digitsOnly)
    }
    setShowSuggestions(value.length > 0)
    setContactName('')
  }

  const handleInputFocus = () => {
    if (searchQuery.length > 0 || phoneNumber.length > 0) {
      setShowSuggestions(true)
    }
  }

  const handleInputBlur = () => {
    // Delay hiding suggestions to allow click events to fire
    setTimeout(() => setShowSuggestions(false), 150)
  }

  // Demo functions to simulate incoming calls
  const simulateIncomingCall = () => {
    setCaller(mockCaller)
    setCallState("ringing")
    setIsExpanded(true)
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Collapsed State - Phone Icon Button */}
      <button
        onClick={() => setIsExpanded(true)}
        className={cn(
          "flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg transition-all duration-300 hover:bg-emerald-600 hover:scale-110",
          isExpanded && "pointer-events-none scale-0 opacity-0",
          callState === "ringing" && "animate-pulse bg-amber-500 hover:bg-amber-600",
          callState === "ongoing" && "animate-pulse bg-emerald-500 hover:bg-emerald-600",
        )}
        aria-label="Open dialer"
      >
        <Phone className={cn("h-6 w-6", callState === "ringing" && "animate-bounce")} />
      </button>

      {/* Expanded State - Dialer Widget */}
      <div
        className={cn(
          "absolute bottom-0 right-0 w-80 origin-bottom-right rounded-2xl bg-card shadow-2xl transition-all duration-300 border border-border",
          isExpanded ? "scale-100 opacity-100" : "pointer-events-none scale-0 opacity-0"
        )}
      >
        {/* Ringing State */}
        {callState === "ringing" && (
          <>
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-4 py-3 bg-amber-500/10">
              <div className="flex items-center gap-2">
                <Phone className="h-5 w-5 text-amber-500 animate-pulse" />
                <span className="font-semibold text-card-foreground">Incoming Call</span>
              </div>
              <button
                onClick={() => setIsExpanded(false)}
                className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-card-foreground"
                aria-label="Minimize"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Caller Info */}
            <div className="flex flex-col items-center py-8 px-4">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-secondary mb-4">
                <User className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold text-card-foreground">{caller.name}</h3>
              <p className="text-muted-foreground mt-1">{caller.phoneNumber}</p>
              <p className="text-sm text-amber-500 mt-2 animate-pulse">Ringing...</p>
            </div>

            {/* Answer/Decline Buttons */}
            <div className="flex gap-4 px-6 pb-6">
              <Button
                onClick={handleDecline}
                className="flex-1 h-14 rounded-full bg-red-500 text-white hover:bg-red-600"
              >
                <PhoneOff className="mr-2 h-5 w-5" />
                Decline
              </Button>
              <Button
                onClick={handleAnswer}
                className="flex-1 h-14 rounded-full bg-emerald-500 text-white hover:bg-emerald-600"
              >
                <PhoneCall className="mr-2 h-5 w-5" />
                Answer
              </Button>
            </div>
          </>
        )}

        {/* Transferring State */}
        {callState === "transferring" && transferringTo && (
          <div className="flex flex-col items-center py-10 px-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/20 mb-6">
              <CheckCircle2 className="h-10 w-10 text-emerald-500" />
            </div>
            <h3 className="text-xl font-semibold text-card-foreground text-center">Call Transferred</h3>
            <p className="text-muted-foreground mt-2 text-center">
              Successfully transferred to
            </p>
            <p className="font-medium text-card-foreground mt-1">{transferringTo.name}</p>
            <p className="text-sm text-muted-foreground">Ext. {transferringTo.extension}</p>
            <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Closing...
            </div>
          </div>
        )}

        {/* Ongoing Call State */}
        {callState === "ongoing" && (
          <>
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-4 py-3 bg-emerald-500/10">
              {showTransferPanel ? (
                <>
                  <button
                    onClick={() => setShowTransferPanel(false)}
                    className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-card-foreground"
                    aria-label="Back"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </button>
                  <span className="font-semibold text-card-foreground">Transfer Call</span>
                  <button
                    onClick={() => setIsExpanded(false)}
                    className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-card-foreground"
                    aria-label="Minimize"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <Phone className="h-5 w-5 text-emerald-500" />
                    <span className="font-semibold text-card-foreground">On Call</span>
                  </div>
                  <button
                    onClick={() => setIsExpanded(false)}
                    className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-card-foreground"
                    aria-label="Minimize"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </>
              )}
            </div>

            {/* Transfer Panel */}
            {showTransferPanel ? (
              <div className="flex flex-col">
                {/* Agent List */}
                <div className="max-h-80 overflow-y-auto">
                  <div className="px-4 py-2 bg-muted/50">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Available Agents</span>
                  </div>
                  {agentsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted border-t-primary"></div>
                    </div>
                  ) : agents.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No agents available
                    </div>
                  ) : (
                  <ul className="divide-y divide-border">
                    {agents.map((agent) => (
                      <li key={agent.id}>
                        <button
                          onClick={() => handleTransferToAgent(agent)}
                          disabled={agent.status !== "online"}
                          className={cn(
                            "w-full flex items-center gap-3 px-4 py-3 transition-colors text-left",
                            agent.status === "online" 
                              ? "hover:bg-muted cursor-pointer" 
                              : "opacity-50 cursor-not-allowed"
                          )}
                        >
                          <div className="relative">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary">
                              <User className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <span
                              className={cn(
                                "absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-card",
                                getStatusColor(agent.status)
                              )}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-card-foreground truncate">{agent.name}</p>
                            <p className="text-sm text-muted-foreground">Ext. {agent.extension}</p>
                          </div>
                          <div className="flex items-center">
                            <span
                              className={cn(
                                "text-xs font-medium px-2 py-1 rounded-full",
                                agent.status === "online" && "bg-emerald-100 text-emerald-700",
                                agent.status === "busy" && "bg-red-100 text-red-700",
                                agent.status === "away" && "bg-amber-100 text-amber-700"
                              )}
                            >
                              {agent.status === "online" ? "Online" : agent.status === "busy" ? "Busy" : "Away"}
                            </span>
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                  )}
                </div>

                {/* Cancel Transfer Button */}
                <div className="p-4 border-t border-border">
                  <Button
                    variant="outline"
                    onClick={() => setShowTransferPanel(false)}
                    className="w-full"
                  >
                    Cancel Transfer
                  </Button>
                </div>
              </div>
            ) : (
              <>
                {/* Caller Info & Duration */}
                <div className="flex flex-col items-center py-6 px-4 border-b border-border">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 mb-3">
                    <User className="h-8 w-8 text-emerald-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-card-foreground">{caller.name}</h3>
                  <p className="text-sm text-muted-foreground">{caller.phoneNumber}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span className="text-lg font-mono text-emerald-500">{formatDuration(callDuration)}</span>
                  </div>
                </div>

                {/* DTMF Pad Toggle */}
                {showDtmfPad ? (
              <>
                {/* DTMF Input Display */}
                <div className="flex items-center justify-between border-b border-border px-4 py-3">
                  <div className="min-h-8 flex-1 text-center">
                    <span className="text-xl font-medium tracking-wider text-card-foreground">
                      {dtmfInput || <span className="text-muted-foreground">DTMF Input</span>}
                    </span>
                  </div>
                  {dtmfInput && (
                    <button
                      onClick={handleDelete}
                      className="ml-2 rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-card-foreground"
                      aria-label="Delete digit"
                    >
                      <Delete className="h-5 w-5" />
                    </button>
                  )}
                </div>

                {/* DTMF Dial Pad */}
                <div className="grid grid-cols-3 gap-2 p-4">
                  {dialPadButtons.map(({ digit, letters }) => (
                    <button
                      key={digit}
                      onClick={() => handleDigitPress(digit)}
                      className="flex h-12 flex-col items-center justify-center rounded-full bg-secondary text-secondary-foreground transition-all hover:bg-accent active:scale-95"
                    >
                      <span className="text-lg font-semibold">{digit}</span>
                      {letters && (
                        <span className="text-[9px] tracking-wider text-muted-foreground">
                          {letters}
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                {/* Hide Keypad Button */}
                <div className="px-4 pb-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowDtmfPad(false)}
                    className="w-full"
                  >
                    Hide Keypad
                  </Button>
                </div>
              </>
            ) : (
              /* Action Buttons */
              <div className="grid grid-cols-2 gap-3 p-4">
                <Button
                  variant="outline"
                  onClick={() => setShowDtmfPad(true)}
                  className="h-14 flex-col gap-1"
                >
                  <Grid3X3 className="h-5 w-5" />
                  <span className="text-xs">Keypad</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={handleTransfer}
                  className="h-14 flex-col gap-1"
                >
                  <PhoneForwarded className="h-5 w-5" />
                  <span className="text-xs">Transfer</span>
                </Button>
              </div>
            )}

            {/* Hangup Button */}
                <div className="px-4 pb-4">
                  <Button
                    onClick={handleHangup}
                    className="w-full h-12 rounded-full bg-red-500 text-white hover:bg-red-600"
                  >
                    <PhoneOff className="mr-2 h-5 w-5" />
                    End Call
                  </Button>
                </div>
              </>
            )}
          </>
        )}

        {/* Idle State - Original Dialer */}
        {callState === "idle" && (
          <>
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div className="flex items-center gap-2">
                <Phone className="h-5 w-5 text-emerald-500" />
                <span className="font-semibold text-card-foreground">Dialer</span>
              </div>
              <div className="flex items-center gap-1">
                {/* Demo button to simulate incoming call */}
                <button
                  onClick={simulateIncomingCall}
                  className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-amber-100 hover:text-amber-600 text-xs px-2"
                  aria-label="Simulate incoming call"
                  title="Simulate incoming call"
                >
                  Demo
                </button>
                <button
                  onClick={() => setIsExpanded(false)}
                  className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-card-foreground"
                  aria-label="Close dialer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Phone Number Input with Autocomplete */}
            <div className="relative border-b border-border">
              <div className="flex items-center px-4 py-3">
                <Search className="h-4 w-4 text-muted-foreground mr-2 flex-shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  value={searchQuery || formatPhoneNumber(phoneNumber)}
                  onChange={handleSearchChange}
                  onFocus={handleInputFocus}
                  onBlur={handleInputBlur}
                  placeholder="Enter name or number"
                  className="flex-1 bg-transparent text-lg font-medium tracking-wide text-card-foreground placeholder:text-muted-foreground focus:outline-none"
                />
                {(phoneNumber || searchQuery) && (
                  <button
                    onClick={() => {
                      setPhoneNumber("")
                      setSearchQuery("")
                      setShowSuggestions(false)
                    }}
                    className="ml-2 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-card-foreground"
                    aria-label="Clear"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Autocomplete Suggestions */}
              {showSuggestions && (
                <div className="absolute left-0 right-0 top-full z-10 max-h-48 overflow-y-auto border-b border-border bg-card shadow-lg">
                  {contactsLoading ? (
                    <div className="flex items-center justify-center py-4">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-muted border-t-primary"></div>
                    </div>
                  ) : contacts.length > 0 ? (
                    contacts.map((contact) => (
                      <button
                        key={contact.id}
                        onClick={() => handleSelectContact(contact)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-muted"
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary flex-shrink-0">
                          <User className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-card-foreground text-sm truncate">{contact.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatPhoneNumber(contact.phone_number)}
                            {contact.company && ` • ${contact.company}`}
                          </p>
                        </div>
                      </button>
                    ))
                  ) : searchQuery.length > 0 ? (
                    <div className="text-center py-4 text-sm text-muted-foreground">
                      No contacts found
                    </div>
                  ) : null}
                </div>
              )}
            </div>

            {/* Dial Pad */}
            <div className="grid grid-cols-3 gap-2 p-4">
              {dialPadButtons.map(({ digit, letters }) => (
                <button
                  key={digit}
                  onClick={() => handleDigitPress(digit)}
                  className="flex h-14 flex-col items-center justify-center rounded-full bg-secondary text-secondary-foreground transition-all hover:bg-accent active:scale-95"
                >
                  <span className="text-xl font-semibold">{digit}</span>
                  {letters && (
                    <span className="text-[10px] tracking-wider text-muted-foreground">
                      {letters}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Call Button */}
            <div className="px-4 pb-4">
              <Button
                onClick={handleCall}
                disabled={!phoneNumber}
                className="w-full h-12 rounded-full bg-emerald-500 text-white hover:bg-emerald-600 disabled:bg-muted disabled:text-muted-foreground"
              >
                <PhoneCall className="mr-2 h-5 w-5" />
                Call
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
