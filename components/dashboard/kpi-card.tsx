import { type LucideIcon, TrendingUp, TrendingDown, Minus } from "lucide-react"
import { cn } from "@/lib/utils"

type KpiVariant = "indigo" | "green" | "amber" | "red"

interface KpiCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  variant?: KpiVariant
  trend?: number
  trendLabel?: string
}

const variantConfig: Record<KpiVariant, { gradient: string; iconBg: string; iconColor: string; trendBg: string }> = {
  indigo: {
    gradient: "kpi-gradient-indigo",
    iconBg: "bg-[oklch(0.55_0.22_264/0.12)]",
    iconColor: "text-[oklch(0.55_0.22_264)]",
    trendBg: "bg-[oklch(0.55_0.22_264/0.1)] text-[oklch(0.45_0.22_264)]",
  },
  green: {
    gradient: "kpi-gradient-green",
    iconBg: "bg-[oklch(0.65_0.18_162/0.12)]",
    iconColor: "text-[oklch(0.55_0.18_162)]",
    trendBg: "bg-[oklch(0.65_0.18_162/0.1)] text-[oklch(0.45_0.18_162)]",
  },
  amber: {
    gradient: "kpi-gradient-amber",
    iconBg: "bg-[oklch(0.75_0.18_85/0.12)]",
    iconColor: "text-[oklch(0.60_0.18_85)]",
    trendBg: "bg-[oklch(0.75_0.18_85/0.1)] text-[oklch(0.55_0.18_85)]",
  },
  red: {
    gradient: "kpi-gradient-red",
    iconBg: "bg-[oklch(0.62_0.23_27/0.12)]",
    iconColor: "text-[oklch(0.55_0.23_27)]",
    trendBg: "bg-[oklch(0.62_0.23_27/0.1)] text-[oklch(0.45_0.23_27)]",
  },
}

function formatValue(value: string | number): string {
  if (typeof value === "number") {
    if (value >= 1000) return (value / 1000).toFixed(1) + "k"
    return String(value)
  }
  return value
}

export function KpiCard({ title, value, subtitle, icon: Icon, variant = "indigo", trend, trendLabel }: KpiCardProps) {
  const config = variantConfig[variant]

  const TrendIcon = trend === undefined ? null
    : trend > 0 ? TrendingUp
    : trend < 0 ? TrendingDown
    : Minus

  const trendPositive = trend !== undefined && trend > 0
  const trendNegative = trend !== undefined && trend < 0

  return (
    <div
      className={cn(
        "relative rounded-2xl border border-border/60 p-5 overflow-hidden transition-all duration-200 hover:shadow-md hover:-translate-y-0.5",
        config.gradient
      )}
    >
      {/* Subtle corner decoration */}
      <div className={cn("absolute -top-6 -right-6 w-20 h-20 rounded-full opacity-20", config.iconBg)} />

      <div className="flex items-start justify-between mb-4">
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", config.iconBg)}>
          <Icon className={cn("w-5 h-5", config.iconColor)} />
        </div>

        {TrendIcon && trend !== undefined && (
          <div className={cn(
            "flex items-center gap-1 text-xs font-semibold rounded-full px-2 py-1",
            trendPositive
              ? "bg-emerald-50 text-emerald-700"
              : trendNegative
              ? "bg-red-50 text-red-700"
              : "bg-muted text-muted-foreground"
          )}>
            <TrendIcon className="w-3 h-3" />
            {Math.abs(trend)}%
          </div>
        )}
      </div>

      <div>
        <p className="text-2xl font-bold text-foreground tracking-tight tabular-nums">
          {formatValue(value)}
        </p>
        <p className="text-sm font-medium text-muted-foreground mt-1">{title}</p>
        {(subtitle || trendLabel) && (
          <p className="text-xs text-muted-foreground/70 mt-1">
            {subtitle || trendLabel}
          </p>
        )}
      </div>
    </div>
  )
}
