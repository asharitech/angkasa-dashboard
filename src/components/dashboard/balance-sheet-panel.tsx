import { formatRupiah, formatRupiahCompact } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

function Sparkline({ data, width = 140, height = 40 }: { data: number[]; width?: number; height?: number }) {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const step = width / (data.length - 1);
  const pts = data.map((v, i) => [i * step, height - ((v - min) / span) * (height - 6) - 3] as [number, number]);
  const line = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${line} L${width},${height} L0,${height} Z`;
  const last = pts[pts.length - 1];
  const prev = pts[pts.length - 2];
  const trending = last[1] <= prev[1]; // lower y = higher value

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={cn("block", trending ? "text-success" : "text-warning")}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="spk-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.18" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#spk-fill)" />
      <path d={line} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={last[0]} cy={last[1]} r="2.5" fill="white" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

export function BalanceSheetPanel({
  saldo,
  kewajiban,
  danaEfektif,
  healthRatio,
  healthLabel,
  healthTone,
  displayDate,
  trend,
}: {
  saldo: number;
  kewajiban: number;
  danaEfektif: number;
  healthRatio: number;
  healthLabel: string;
  healthTone: "success" | "warning" | "danger";
  displayDate?: string | null;
  trend?: number[];
}) {
  const kewajibanPct = saldo > 0 ? (kewajiban / saldo) * 100 : 0;
  const danaEfektifPct = saldo > 0 ? (danaEfektif / saldo) * 100 : 0;

  const badgeVariant: "success" | "warning" | "destructive" =
    healthTone === "success" ? "success" : healthTone === "warning" ? "warning" : "destructive";

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      {/* 3-column balance sheet */}
      <div className="grid grid-cols-1 divide-y divide-border md:grid-cols-3 md:divide-x md:divide-y-0">
        {/* Column 1: Saldo Total */}
        <div className="p-5">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Saldo Total
          </p>
          <p className="mt-2 text-[22px] font-bold tabular-nums leading-tight">
            {formatRupiahCompact(saldo)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Per Laporan Op</p>
        </div>

        {/* Column 2: Kewajiban */}
        <div className="p-5">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Kewajiban
          </p>
          <p className="mt-2 text-[22px] font-bold tabular-nums leading-tight text-warning">
            − {formatRupiahCompact(kewajiban)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Tertunggak</p>
        </div>

        {/* Column 3: Dana Efektif — the star */}
        <div className="bg-primary/5 p-5">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-primary/70">
            Dana Efektif
          </p>
          <p className="mt-2 text-[40px] font-extrabold tabular-nums leading-tight tracking-tight text-primary">
            {formatRupiah(danaEfektif)}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge variant={badgeVariant} className="text-[10px]">
              {healthLabel}
            </Badge>
            {displayDate && (
              <span className="text-xs text-muted-foreground">per {displayDate}</span>
            )}
          </div>
          {/* Sparkline */}
          {trend && trend.length >= 2 && (
            <div className="mt-3">
              <Sparkline data={trend} width={140} height={36} />
              <p className="mt-1 text-[10px] text-muted-foreground">Arus kas 12 bulan terakhir</p>
            </div>
          )}
        </div>
      </div>

      {/* Equation stacked bar — single shared scale */}
      <div className="border-t border-border/60 px-5 py-3 space-y-1.5">
        <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full bg-primary/70"
            style={{ width: `${danaEfektifPct.toFixed(2)}%` }}
          />
          <div
            className="h-full bg-warning/60"
            style={{ width: `${kewajibanPct.toFixed(2)}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
          <span>
            <span className="font-semibold text-primary">Dana Efektif</span>
            {" "}
            {Math.round(danaEfektifPct)}%
          </span>
          <span>
            <span className="font-semibold text-warning">Kewajiban</span>
            {" "}
            {Math.round(kewajibanPct)}%
          </span>
          <span>Saldo {formatRupiahCompact(saldo)}</span>
        </div>
      </div>
    </div>
  );
}
