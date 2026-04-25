import Link from "next/link"
import { cn } from "@/lib/utils"

function formatPeriodLabel(period: string): string {
  const [year, month] = period.split("-")
  const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"]
  return `${months[parseInt(month) - 1]} ${year}`
}

type Props = {
  periods: { period: string; is_current: boolean }[]
  activePeriod: string | null
}

export function PeriodChips({ periods, activePeriod }: Props) {
  if (!periods.length) return null

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
      {periods.map((p) => {
        const isActive = activePeriod ? p.period === activePeriod : p.is_current
        return (
          <Link
            key={p.period}
            href={`?period=${p.period}`}
            className={cn(
              "inline-flex shrink-0 items-center rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              isActive
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-foreground hover:bg-muted",
            )}
          >
            {formatPeriodLabel(p.period)}
          </Link>
        )
      })}
    </div>
  )
}
