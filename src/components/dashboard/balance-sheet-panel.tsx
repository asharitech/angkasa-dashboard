import { formatRupiah, formatRupiahCompact } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import type { Tone } from "@/lib/colors";

export function BalanceSheetPanel({
  saldo,
  kewajiban,
  danaEfektif,
  healthRatio,
  healthLabel,
  healthTone,
  displayDate,
}: {
  saldo: number;
  kewajiban: number;
  danaEfektif: number;
  healthRatio: number;
  healthLabel: string;
  healthTone: "success" | "warning" | "danger";
  displayDate?: string | null;
}) {
  const kewajibanPct = saldo > 0 ? Math.round((kewajiban / saldo) * 100) : 0;
  const danaEfektifPct = saldo > 0 ? Math.round((danaEfektif / saldo) * 100) : 0;

  const filledCount = Math.round(healthRatio * 20);
  const meterColor =
    healthRatio >= 0.5 ? "bg-success" : healthRatio >= 0.2 ? "bg-warning" : "bg-destructive";

  const badgeVariant: "success" | "warning" | "destructive" =
    healthTone === "success" ? "success" : healthTone === "warning" ? "warning" : "destructive";

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      {/* 3-column balance sheet */}
      <div className="grid grid-cols-1 divide-y divide-border md:grid-cols-3 md:divide-x md:divide-y-0">
        {/* Column 1: Saldo Total */}
        <div className="p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Saldo Total
          </p>
          <p className="mt-2 text-2xl font-bold tabular-nums">
            {formatRupiahCompact(saldo)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Per Laporan Op</p>
        </div>

        {/* Column 2: Kewajiban */}
        <div className="p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Kewajiban
          </p>
          <p className="mt-2 text-2xl font-bold tabular-nums text-destructive">
            {formatRupiahCompact(kewajiban)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Tertunggak</p>
        </div>

        {/* Column 3: Dana Efektif */}
        <div className="bg-primary/5 p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Dana Efektif
          </p>
          <p className="mt-2 text-2xl font-bold tabular-nums text-primary">
            {formatRupiah(danaEfektif)}
          </p>
          <div className="mt-1 flex items-center gap-2">
            <Badge variant={badgeVariant} className="text-[10px]">
              {healthLabel}
            </Badge>
            {displayDate && (
              <span className="text-xs text-muted-foreground">
                per {displayDate}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Equation bar row */}
      <div className="border-t border-border/60 px-5 py-3 grid grid-cols-[1fr_24px_1fr_24px_1fr] items-center gap-3">
        {/* Saldo bar */}
        <div className="h-3 rounded-full bg-foreground/20 w-full" />
        <span className="text-center text-lg font-light text-muted-foreground">−</span>
        {/* Kewajiban bar (proportional) */}
        <div className="h-3 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-destructive/60"
            style={{ width: `${kewajibanPct}%` }}
          />
        </div>
        <span className="text-center text-lg font-light text-muted-foreground">=</span>
        {/* Dana efektif bar (proportional) */}
        <div className="h-3 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-primary/70"
            style={{ width: `${danaEfektifPct}%` }}
          />
        </div>
      </div>

      {/* Health meter row */}
      <div className="border-t border-border/60 px-5 py-3 flex items-center gap-4">
        <div className="flex flex-1 items-center gap-0.5">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className={`h-2.5 rounded-sm flex-1 ${i < filledCount ? meterColor : "bg-muted"}`}
            />
          ))}
        </div>
        <p className="shrink-0 text-xs text-muted-foreground">
          {Math.round(healthRatio * 100)}% dana efektif / saldo · {healthLabel}
        </p>
      </div>
    </div>
  );
}
