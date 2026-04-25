import Link from "next/link"
import { cn } from "@/lib/utils"
import { formatPeriodLabel } from "@/lib/period"

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
