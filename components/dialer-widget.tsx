"use client"

import { useState, useEffect, useCallback } from "react"
import { Phone, X, Delete, PhoneCall, PhoneOff, PhoneForwarded, Grid3X3, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type CallState = "idle" | "ringing" | "ongoing"

interface CallerInfo {
  name: string
  phoneNumber: string
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

export function DialerWidget() {
  const [isExpanded, setIsExpanded] = useState(false)
  const [phoneNumber, setPhoneNumber] = useState("")
  const [callState, setCallState] = useState<CallState>("idle")
  const [caller, setCaller] = useState<CallerInfo>(mockCaller)
  const [callDuration, setCallDuration] = useState(0)
  const [showDtmfPad, setShowDtmfPad] = useState(false)
  const [dtmfInput, setDtmfInput] = useState("")

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
      setCaller({ name: "Outgoing Call", phoneNumber: formatPhoneNumber(phoneNumber) })
      setCallState("ongoing")
    }
  }

  const handleAnswer = () => {
    setCallState("ongoing")
    setShowDtmfPad(false)
    setDtmfInput("")
  }

  const handleDecline = () => {
    setCallState("idle")
    setShowDtmfPad(false)
    setDtmfInput("")
  }

  const handleHangup = () => {
    setCallState("idle")
    setShowDtmfPad(false)
    setDtmfInput("")
    setCallDuration(0)
  }

  const handleTransfer = () => {
    // In a real app, this would open a transfer dialog
    alert("Transfer call functionality")
  }

  const formatPhoneNumber = (number: string) => {
    const cleaned = number.replace(/\D/g, "")
    if (cleaned.length <= 3) return cleaned
    if (cleaned.length <= 6) return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`
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
          callState === "ringing" && "animate-pulse bg-amber-500 hover:bg-amber-600"
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

        {/* Ongoing Call State */}
        {callState === "ongoing" && (
          <>
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-4 py-3 bg-emerald-500/10">
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
            </div>

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

            {/* Phone Number Display */}
            <div className="flex items-center justify-between border-b border-border px-4 py-4">
              <div className="min-h-8 flex-1 text-center">
                <span className="text-2xl font-medium tracking-wider text-card-foreground">
                  {formatPhoneNumber(phoneNumber) || (
                    <span className="text-muted-foreground">Enter number</span>
                  )}
                </span>
              </div>
              {phoneNumber && (
                <button
                  onClick={handleDelete}
                  className="ml-2 rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-card-foreground"
                  aria-label="Delete digit"
                >
                  <Delete className="h-5 w-5" />
                </button>
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
