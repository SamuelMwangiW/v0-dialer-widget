"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { Phone, Loader2, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error || "Invalid credentials")
        return
      }

      toast.success("Welcome back!")
      const from = searchParams.get("from") || "/"
      router.push(from)
      router.refresh()
    } catch {
      toast.error("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md">
      {/* Glassmorphism card */}
      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl p-8">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="w-14 h-14 rounded-2xl bg-[oklch(0.55_0.22_264)] flex items-center justify-center shadow-lg shadow-[oklch(0.55_0.22_264/0.4)]">
            <Phone className="w-7 h-7 text-white" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white tracking-tight">CallCenter Pro</h1>
            <p className="text-sm text-white/50 mt-1">Admin Dashboard</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-white/70 text-sm font-medium">
              Email address
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="admin@callcenter.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="bg-white/10 border-white/15 text-white placeholder:text-white/30 focus:border-[oklch(0.55_0.22_264)] focus:ring-[oklch(0.55_0.22_264/0.3)] h-11"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-white/70 text-sm font-medium">
              Password
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="bg-white/10 border-white/15 text-white placeholder:text-white/30 focus:border-[oklch(0.55_0.22_264)] focus:ring-[oklch(0.55_0.22_264/0.3)] h-11 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-11 bg-[oklch(0.55_0.22_264)] hover:bg-[oklch(0.50_0.22_264)] text-white font-semibold shadow-lg shadow-[oklch(0.55_0.22_264/0.3)] transition-all duration-200 mt-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Signing in...
              </>
            ) : (
              "Sign in"
            )}
          </Button>
        </form>

        {/* Demo credentials */}
        <div className="mt-6 p-3 rounded-xl bg-white/5 border border-white/10">
          <p className="text-xs text-white/40 text-center font-medium uppercase tracking-wider mb-2">Demo Credentials</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-white/30">Email</span>
              <p className="text-white/70 font-mono">admin@callcenter.com</p>
            </div>
            <div>
              <span className="text-white/30">Password</span>
              <p className="text-white/70 font-mono">admin123</p>
            </div>
          </div>
        </div>
      </div>

      {/* Background decorations */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-[oklch(0.55_0.22_264/0.15)] blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-[oklch(0.55_0.22_290/0.10)] blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-[oklch(0.55_0.22_264/0.05)] blur-3xl" />
      </div>
    </div>
  )
}
