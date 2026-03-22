"use client"

import { useState } from "react"
import { Phone, X, Delete, PhoneCall } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

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

export function DialerWidget() {
  const [isExpanded, setIsExpanded] = useState(false)
  const [phoneNumber, setPhoneNumber] = useState("")

  const handleDigitPress = (digit: string) => {
    setPhoneNumber((prev) => prev + digit)
  }

  const handleDelete = () => {
    setPhoneNumber((prev) => prev.slice(0, -1))
  }

  const handleCall = () => {
    if (phoneNumber) {
      alert(`Calling ${phoneNumber}...`)
    }
  }

  const formatPhoneNumber = (number: string) => {
    const cleaned = number.replace(/\D/g, "")
    if (cleaned.length <= 3) return cleaned
    if (cleaned.length <= 6) return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Collapsed State - Phone Icon Button */}
      <button
        onClick={() => setIsExpanded(true)}
        className={cn(
          "flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg transition-all duration-300 hover:bg-emerald-600 hover:scale-110",
          isExpanded && "pointer-events-none scale-0 opacity-0"
        )}
        aria-label="Open dialer"
      >
        <Phone className="h-6 w-6" />
      </button>

      {/* Expanded State - Dialer Widget */}
      <div
        className={cn(
          "absolute bottom-0 right-0 w-72 origin-bottom-right rounded-2xl bg-card shadow-2xl transition-all duration-300 border border-border",
          isExpanded ? "scale-100 opacity-100" : "pointer-events-none scale-0 opacity-0"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <Phone className="h-5 w-5 text-emerald-500" />
            <span className="font-semibold text-card-foreground">Dialer</span>
          </div>
          <button
            onClick={() => setIsExpanded(false)}
            className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-card-foreground"
            aria-label="Close dialer"
          >
            <X className="h-5 w-5" />
          </button>
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
      </div>
    </div>
  )
}
