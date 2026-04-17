import Link from "next/link";
import { cn } from "@/lib/utils";

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
];

function monthLabel(period: string): string {
  const [y, m] = period.split("-");
  const idx = Number(m) - 1;
  return `${MONTH_NAMES[idx] ?? m} ${y}`;
}

/**
 * Server-rendered period picker. Generates a chip for "Semua" + N most recent months
 * including the current month, linking to the same path with ?period=YYYY-MM.
 *
 * @param basePath  page path (e.g. "/aktivitas")
 * @param current   currently selected period or undefined for "Semua"
 * @param months    number of recent months to expose (default 4)
 * @param extraParams query params to preserve (e.g. type/domain)
 */
export function PeriodPicker({
  basePath,
  current,
  months = 4,
  extraParams = {},
}: {
  basePath: string;
  current?: string;
  months?: number;
  extraParams?: Record<string, string>;
}) {
  // WITA (Asia/Makassar) reference — Vercel containers run UTC so naive new Date() skews the month
  // during the 16:00–23:59 UTC window (00:00–08:00 WITA next day).
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Makassar",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(new Date());
  const witaYear = Number(parts.find((p) => p.type === "year")?.value);
  const witaMonth = Number(parts.find((p) => p.type === "month")?.value);
  const periods: string[] = [];
  for (let i = 0; i < months; i++) {
    const d = new Date(Date.UTC(witaYear, witaMonth - 1 - i, 1));
    periods.push(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`);
  }

  function hrefFor(period?: string) {
    const qs = new URLSearchParams(extraParams);
    if (period) qs.set("period", period);
    const s = qs.toString();
    return s ? `${basePath}?${s}` : basePath;
  }

  return (
    <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
      <Link
        href={hrefFor(undefined)}
        className={cn(
          "shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors border",
          !current
            ? "bg-foreground text-background border-foreground"
            : "bg-background text-muted-foreground border-border hover:text-foreground",
        )}
      >
        Semua
      </Link>
      {periods.map((p) => {
        const active = p === current;
        return (
          <Link
            key={p}
            href={hrefFor(p)}
            className={cn(
              "shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors border",
              active
                ? "bg-foreground text-background border-foreground"
                : "bg-background text-muted-foreground border-border hover:text-foreground",
            )}
          >
            {monthLabel(p)}
          </Link>
        );
      })}
    </div>
  );
}
