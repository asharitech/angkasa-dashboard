import Link from "next/link"
import {
  getLedger,
  getLedgerByCode,
  getLaporanOpReconciliation,
  getDashboardTrend,
  getLaporanOpPeriods,
  getLaporanOpMonthlyFlow,
} from "@/lib/data"
import { getSession } from "@/lib/auth"
import { formatRupiah, formatRupiahCompact, formatDate } from "@/lib/format"
import { kewajibanRows } from "@/lib/kewajiban-display"
import { cn } from "@/lib/utils"
import { SectionCard } from "@/components/section-card"
import { IconBadge } from "@/components/primitives/icon-badge"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { EmptyState } from "@/components/empty-state"
import { Sparkline } from "@/components/laporan-op/sparkline"
import { StackBar } from "@/components/laporan-op/stack-bar"
import { PeriodChips } from "@/components/laporan-op/period-chips"
import { EntriesTable } from "@/components/laporan-op/entries-table"
import {
  FileText,
  TrendingUp,
  TrendingDown,
  Scale,
  GitCompare,
  Receipt,
  Inbox,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  Download,
  Pencil,
} from "lucide-react"

export const dynamic = "force-dynamic"

function formatPeriodLabel(period: string): string {
  const [year, month] = period.split("-")
  const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"]
  return `${months[parseInt(month) - 1]} ${year}`
}

const KEWAJIBAN_COLORS = [
  "oklch(0.577 0.245 27.325)",
  "oklch(0.577 0.245 27.325 / 0.65)",
  "oklch(0.577 0.245 27.325 / 0.45)",
  "oklch(0.577 0.245 27.325 / 0.30)",
]

// Grouped bar chart for masuk vs keluar over last 6 months
function GroupedBarChart({
  data,
}: {
  data: { month: string; masuk: number; keluar: number }[]
}) {
  if (!data.length) return null

  const maxVal = Math.max(...data.flatMap((d) => [d.masuk, d.keluar]), 1)
  const chartH = 64
  const n = data.length
  const viewW = 200
  const groupW = viewW / n
  const barW = Math.min(12, groupW * 0.35)
  const gap = barW * 0.25

  return (
    <svg
      width="100%"
      height={chartH + 16}
      viewBox={`0 0 ${viewW} ${chartH + 16}`}
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
    >
      {data.map((d, i) => {
        const x = i * groupW + (groupW - barW * 2 - gap) / 2
        const masukH = Math.round((d.masuk / maxVal) * chartH)
        const keluarH = Math.round((d.keluar / maxVal) * chartH)
        const label = formatPeriodLabel(d.month).split(" ")[0]
        return (
          <g key={d.month}>
            {/* Masuk bar */}
            <rect
              x={x}
              y={chartH - masukH}
              width={barW}
              height={masukH}
              rx={2}
              fill="oklch(0.627 0.194 149.214)"
              fillOpacity={0.85}
            />
            {/* Keluar bar */}
            <rect
              x={x + barW + gap}
              y={chartH - keluarH}
              width={barW}
              height={keluarH}
              rx={2}
              fill="oklch(0.577 0.245 27.325)"
              fillOpacity={0.85}
            />
            {/* Month label */}
            <text
              x={x + barW + gap / 2 + barW / 2}
              y={chartH + 12}
              textAnchor="middle"
              fontSize={9}
              fill="currentColor"
              opacity={0.5}
            >
              {label}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

export default async function LaporanOpPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>
}) {
  const { period: periodParam } = await searchParams

  const [ledger, recon, trend, periods, monthlyFlow, session] = await Promise.all([
    periodParam ? getLedgerByCode("laporan_op", periodParam) : getLedger("laporan_op"),
    getLaporanOpReconciliation(),
    getDashboardTrend(),
    getLaporanOpPeriods(),
    getLaporanOpMonthlyFlow(),
    getSession(),
  ])

  const isAdmin = session?.role === "admin"

  // Determine active period
  const activePeriod = periodParam ?? periods.find((p) => p.is_current)?.period ?? null

  if (!ledger?.laporan_op) {
    return (
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <IconBadge icon={FileText} tone="primary" size="md" />
          <div>
            <h1 className="text-lg font-semibold leading-tight">Laporan Operasional</h1>
            <p className="text-xs text-muted-foreground">account: btn_yayasan</p>
          </div>
        </div>
        {periods.length > 0 && (
          <PeriodChips periods={periods} activePeriod={activePeriod} />
        )}
        <EmptyState
          icon={Inbox}
          title="Laporan Op belum tersedia"
          description="Snapshot ledger belum di-publish."
        />
      </div>
    )
  }

  const { entries, totals, kewajiban, dana_efektif } = ledger.laporan_op
  const reconHasDiff = recon && (recon.diffMasuk !== 0 || recon.diffKeluar !== 0)
  const reconSynced = recon && recon.diffMasuk === 0 && recon.diffKeluar === 0

  // Trend data for sparkline
  const trendValues = trend.map((t) => t.net)

  // Delta vs previous month
  const currentIdx = trend.findIndex((t) => t.month === activePeriod)
  const prevNet = currentIdx > 0 ? trend[currentIdx - 1].net : null
  const delta = prevNet != null ? dana_efektif - prevNet : null

  // Kewajiban rows and segments for stack bar
  const kRows = kewajibanRows(kewajiban, { includeTotal: false })
  const stackSegments = kRows.map(([label, val], i) => ({
    value: val,
    color: KEWAJIBAN_COLORS[i % KEWAJIBAN_COLORS.length],
    label,
  }))

  const saldoPct =
    totals.saldo > 0 ? Math.round((kewajiban.total / totals.saldo) * 100) : 0

  const periodLabel = activePeriod ? formatPeriodLabel(activePeriod) : ""

  return (
    <div className="space-y-5">
      {/* ── 1. Header ribbon ── */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <IconBadge icon={FileText} tone="primary" size="md" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold leading-tight">Laporan Operasional</h1>
              <Badge variant="secondary" className="text-xs">btn_yayasan</Badge>
            </div>
            {ledger.as_of && (
              <p className="text-xs text-muted-foreground">Snapshot per {formatDate(ledger.as_of)}</p>
            )}
          </div>
        </div>
        {isAdmin && (
          <div className="flex items-center gap-2">
            <button
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "gap-1.5",
              )}
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh dari entries
            </button>
            <button
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "gap-1.5",
              )}
            >
              <Download className="h-3.5 w-3.5" />
              Export CSV
            </button>
            <button
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "gap-1.5",
              )}
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit snapshot
            </button>
          </div>
        )}
      </div>

      {/* ── 2. Period chips ── */}
      {periods.length > 0 && (
        <PeriodChips periods={periods} activePeriod={activePeriod} />
      )}

      {/* ── 3. 3-up hero ── */}
      <div className="grid gap-4 md:grid-cols-[1.4fr_1fr_1fr]">
        {/* A. Dana Efektif */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Dana Efektif
          </p>
          <p className="text-4xl font-bold tabular-nums leading-none">
            {formatRupiahCompact(dana_efektif)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {formatRupiahCompact(totals.saldo)} saldo − {formatRupiahCompact(kewajiban.total)} kewajiban
          </p>
          <div className="mt-4">
            {trendValues.length >= 2 && (
              <Sparkline
                data={trendValues}
                width={240}
                height={40}
                color="oklch(0.627 0.194 149.214)"
                strokeWidth={2}
                showDot
              />
            )}
          </div>
          {delta != null && (
            <div
              className={cn(
                "mt-2 flex items-center gap-1 text-xs font-medium",
                delta >= 0 ? "text-success" : "text-destructive",
              )}
            >
              {delta >= 0 ? (
                <ArrowUp className="h-3 w-3" />
              ) : (
                <ArrowDown className="h-3 w-3" />
              )}
              {formatRupiahCompact(Math.abs(delta))} vs bulan lalu
            </div>
          )}
        </div>

        {/* B. Arus Bersih */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Arus Bersih · {periodLabel}
          </p>
          <div className="mb-4 flex gap-4">
            <div>
              <div className="flex items-center gap-1 text-xs text-success">
                <TrendingUp className="h-3 w-3" />
                masuk
              </div>
              <p className="text-sm font-semibold tabular-nums text-success">
                {formatRupiahCompact(totals.masuk)}
              </p>
            </div>
            <div>
              <div className="flex items-center gap-1 text-xs text-destructive">
                <TrendingDown className="h-3 w-3" />
                keluar
              </div>
              <p className="text-sm font-semibold tabular-nums text-destructive">
                {formatRupiahCompact(totals.keluar)}
              </p>
            </div>
          </div>
          {monthlyFlow.length > 0 && (
            <div className="overflow-hidden">
              <GroupedBarChart data={monthlyFlow} />
            </div>
          )}
          <div className="mt-2 flex gap-3 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <span
                className="inline-block h-2.5 w-2.5 rounded-sm"
                style={{ background: "oklch(0.627 0.194 149.214)" }}
              />
              masuk
            </span>
            <span className="flex items-center gap-1">
              <span
                className="inline-block h-2.5 w-2.5 rounded-sm"
                style={{ background: "oklch(0.577 0.245 27.325)" }}
              />
              keluar
            </span>
          </div>
        </div>

        {/* C. Rekonsiliasi */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Rekonsiliasi
            </p>
            {reconHasDiff ? (
              <Badge variant="warning">ada selisih</Badge>
            ) : reconSynced ? (
              <Badge variant="success">synced</Badge>
            ) : (
              <Badge variant="secondary">—</Badge>
            )}
          </div>
          {recon && (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="text-[10px] uppercase text-muted-foreground">Masuk diff</p>
                  <p
                    className={cn(
                      "font-semibold tabular-nums",
                      recon.diffMasuk !== 0 ? "text-warning" : "text-success",
                    )}
                  >
                    {recon.diffMasuk > 0 ? "+" : recon.diffMasuk < 0 ? "−" : ""}
                    {formatRupiahCompact(Math.abs(recon.diffMasuk))}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase text-muted-foreground">Keluar diff</p>
                  <p
                    className={cn(
                      "font-semibold tabular-nums",
                      recon.diffKeluar !== 0 ? "text-warning" : "text-success",
                    )}
                  >
                    {recon.diffKeluar > 0 ? "+" : recon.diffKeluar < 0 ? "−" : ""}
                    {formatRupiahCompact(Math.abs(recon.diffKeluar))}
                  </p>
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Snapshot vs hitungan live (btn_yayasan). Selisih bukan error — update via mongo_helper bila perlu.
              </p>
              <div className="flex gap-2 pt-1">
                <Link
                  href="/audit"
                  className={cn(buttonVariants({ variant: "outline", size: "xs" }))}
                >
                  Detail
                </Link>
                {isAdmin && (
                  <button
                    className={cn(
                      buttonVariants({ variant: "default", size: "xs" }),
                    )}
                  >
                    Sync ke snapshot
                  </button>
                )}
              </div>
            </div>
          )}
          {!recon && (
            <p className="text-xs text-muted-foreground">Data rekonsiliasi tidak tersedia.</p>
          )}
        </div>
      </div>

      {/* ── 4. Kewajiban composition card ── */}
      <SectionCard
        icon={Receipt}
        title="Kewajiban"
        tone="danger"
        badge={
          <Badge variant="destructive" className="ml-1 tabular-nums">
            {formatRupiahCompact(kewajiban.total)}
          </Badge>
        }
        action={
          totals.saldo > 0 ? (
            <span className="text-xs text-muted-foreground">{saldoPct}% dari saldo</span>
          ) : undefined
        }
      >
        <div className="space-y-3">
          <StackBar segments={stackSegments} />
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {kRows.map(([label, val], i) => (
              <span key={label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-sm"
                  style={{ backgroundColor: KEWAJIBAN_COLORS[i % KEWAJIBAN_COLORS.length] }}
                />
                {label} · {formatRupiahCompact(val)}
              </span>
            ))}
          </div>
        </div>
      </SectionCard>

      {/* ── 5. Detail Transaksi ── */}
      <SectionCard
        icon={Scale}
        title="Detail Transaksi"
        tone="info"
        badge={
          <span className="ml-1 text-xs text-muted-foreground">{entries.length} item</span>
        }
        bodyClassName="px-0 md:px-0"
      >
        <EntriesTable entries={entries} />
      </SectionCard>
    </div>
  )
}
