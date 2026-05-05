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
import { formatPeriodLabel } from "@/lib/period"
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
import { LaporanOpAdminActions } from "@/components/laporan-op/admin-actions"
import {
  FileText,
  TrendingUp,
  TrendingDown,
  Scale,
  Receipt,
  Inbox,
  ArrowUp,
  ArrowDown,
} from "lucide-react"

export const dynamic = "force-dynamic"

// Destructive shades for stacked kewajiban bar — each a distinct opacity level
const KEWAJIBAN_COLORS = [
  "var(--color-destructive, oklch(0.577 0.245 27.325))",
  "oklch(0.577 0.245 27.325 / 0.65)",
  "oklch(0.577 0.245 27.325 / 0.45)",
  "oklch(0.577 0.245 27.325 / 0.30)",
]

// Chart bar colors keyed to semantic intent
const CHART_COLORS = {
  masuk: "var(--color-success, oklch(0.627 0.194 149.214))",
  keluar: "var(--color-destructive, oklch(0.577 0.245 27.325))",
} as const

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
              style={{ fill: CHART_COLORS.masuk }}
              fillOpacity={0.85}
            />
            {/* Keluar bar */}
            <rect
              x={x + barW + gap}
              y={chartH - keluarH}
              width={barW}
              height={keluarH}
              rx={2}
              style={{ fill: CHART_COLORS.keluar }}
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

  if (!ledger || !ledger.laporan_op) {
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

  type ReconState = "synced" | "diff" | "unknown"
  const reconState: ReconState = !recon
    ? "unknown"
    : recon.diffMasuk === 0 && recon.diffKeluar === 0
    ? "synced"
    : "diff"

  // Trend data for sparkline
  const trendValues = trend.map((t) => t.net)

  // Delta vs previous month — trend is sorted ascending; match by period or fall back to last two entries
  const currentIdx = trend.findIndex((t) => t.month === activePeriod)
  const prevTrend = currentIdx > 0
    ? trend[currentIdx - 1]
    : currentIdx === -1 && trend.length >= 2
    ? trend[trend.length - 2]
    : null
  const delta = prevTrend != null ? dana_efektif - prevTrend.net : null

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
          <div className="hidden md:block">
            <LaporanOpAdminActions entries={entries} period={activePeriod} ledger={ledger} />
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
                color={CHART_COLORS.masuk}
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
              <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: CHART_COLORS.masuk }} />
              masuk
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: CHART_COLORS.keluar }} />
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
            {reconState === "diff" ? (
              <Badge variant="warning">ada selisih</Badge>
            ) : reconState === "synced" ? (
              <Badge variant="success">synced</Badge>
            ) : (
              <Badge variant="secondary">—</Badge>
            )}
          </div>
          {reconState !== "unknown" && recon ? (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="text-[10px] uppercase text-muted-foreground">Masuk diff</p>
                  <p className={cn("font-semibold tabular-nums", recon.diffMasuk !== 0 ? "text-warning" : "text-success")}>
                    {recon.diffMasuk > 0 ? "+" : recon.diffMasuk < 0 ? "−" : ""}
                    {formatRupiahCompact(Math.abs(recon.diffMasuk))}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase text-muted-foreground">Keluar diff</p>
                  <p className={cn("font-semibold tabular-nums", recon.diffKeluar !== 0 ? "text-warning" : "text-success")}>
                    {recon.diffKeluar > 0 ? "+" : recon.diffKeluar < 0 ? "−" : ""}
                    {formatRupiahCompact(Math.abs(recon.diffKeluar))}
                  </p>
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Snapshot vs hitungan live (btn_yayasan). Selisih bukan error — update via mongo_helper bila perlu.
              </p>
              <div className="flex gap-2 pt-1">
                <Link href="/audit" className={cn(buttonVariants({ variant: "outline", size: "xs" }))}>
                  Detail
                </Link>
              </div>
            </div>
          ) : (
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
