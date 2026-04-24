import {
  getDashboardSummary,
  getPendingTransfers,
  getDataIntegrityIssues,
  getLaporanOpReconciliation,
  getDashboardTrend,
} from "@/lib/data";
import { getSession } from "@/lib/auth";
import { formatRupiah, formatRupiahCompact, formatDate, formatDateShort } from "@/lib/format";
import { idString } from "@/lib/utils";
import { formatRequestorName } from "@/lib/names";
import { PageHeader } from "@/components/page-header";
import { SectionCard } from "@/components/section-card";
import { AccountAdjustButton } from "@/components/account-adjust-button";
import { NavChevronLink } from "@/components/link-insight";
import { StatRowRupiah } from "@/components/stat-row";
import { Badge } from "@/components/ui/badge";
import { IconBadge } from "@/components/primitives/icon-badge";
import { BalanceSheetPanel } from "@/components/dashboard/balance-sheet-panel";
import { TaskListPanel } from "@/components/dashboard/task-list-panel";
import {
  Landmark,
  Building2,
  Clock,
  Receipt,
  Banknote,
  Truck,
  Wallet,
  FileText,
  CalendarDays,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [data, pendingTransfers, integrityIssues, recon, session, trend] = await Promise.all([
    getDashboardSummary(),
    getPendingTransfers(),
    getDataIntegrityIssues(),
    getLaporanOpReconciliation(),
    getSession(),
    getDashboardTrend(),
  ]);
  const isAdmin = session?.role === "admin";
  const errorCount = integrityIssues.filter((i) => i.severity === "error").length;
  const warnCount = integrityIssues.filter((i) => i.severity === "warn").length;

  const op = data.laporanOp?.laporan_op;
  const danaEfektif = op?.dana_efektif ?? 0;
  const saldo = op?.totals?.saldo ?? 0;
  const totalKewajiban = op?.kewajiban?.total ?? 0;
  const sewaTotal = data.sewa?.sewa?.total ?? 0;
  const sewaLocations = data.sewa?.sewa?.locations ?? [];
  const activeCount = sewaLocations.filter((l) => l.status === "active").length;
  const cashSisa = data.cashYayasan.sisa;

  const healthRatio = saldo > 0 ? danaEfektif / saldo : 0;
  const health = (() => {
    if (healthRatio >= 0.8) return { label: "Sangat Sehat", tone: "success" as const };
    if (healthRatio >= 0.5) return { label: "Sehat", tone: "success" as const };
    if (healthRatio >= 0.2) return { label: "Perhatian", tone: "warning" as const };
    return { label: "Berisiko", tone: "danger" as const };
  })();

  const asOf = data.laporanOp?.as_of;
  const updatedAt = data.laporanOp?.updated_at;
  const displayDate = (() => {
    if (!asOf) return updatedAt ?? null;
    if (!updatedAt) return asOf;
    return new Date(updatedAt) > new Date(asOf) ? updatedAt : asOf;
  })();

  const reconHasDiff = recon && (recon.diffMasuk !== 0 || recon.diffKeluar !== 0);
  const reconAmount = recon ? Math.abs(recon.diffMasuk) + Math.abs(recon.diffKeluar) : 0;

  const yayasanAccounts = data.accounts.filter((a) => a.type === "yayasan");

  const wajibTotal = data.wajibBulanan.reduce((s, w) => s + (w.amount ?? 0), 0);
  const runway = wajibTotal > 0 ? danaEfektif / wajibTotal : null;
  const wajibPct = danaEfektif > 0 && wajibTotal > 0
    ? Math.round((wajibTotal / danaEfektif) * 100)
    : 0;

  // Pengajuan by requestor: max amount for bar scaling
  const pengajuanMax = data.pengajuanByRequestor[0]?.total ?? 1;

  return (
    <div className="space-y-5">
      {/* Mobile-only hero card */}
      <div className="md:hidden rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground p-5 shadow-md">
        <div className="text-xs font-medium opacity-75 flex items-center gap-1.5">
          <Landmark className="h-3 w-3" />
          Yayasan YRBB
          {displayDate && ` · per ${formatDate(displayDate)}`}
        </div>
        <div className="mt-3 text-3xl font-bold tabular-nums tracking-tight">
          {formatRupiah(danaEfektif)}
        </div>
        <div className="text-sm font-medium opacity-90 mt-1">
          Dana Efektif · {health.label}
        </div>
        <div className="mt-3 h-1.5 rounded-full bg-white/20 overflow-hidden">
          <div
            className="h-full rounded-full bg-white/70"
            style={{ width: `${Math.round(healthRatio * 100)}%` }}
          />
        </div>
        <div className="mt-2 text-xs opacity-75">
          {formatRupiahCompact(saldo)} saldo − {formatRupiahCompact(totalKewajiban)} kewajiban
        </div>
      </div>

      {/* Mobile-only shortcut grid */}
      <div className="md:hidden grid grid-cols-4 gap-2">
        {[
          {
            href: "/pengajuan",
            icon: Receipt,
            label: "Pengajuan",
            tone: "danger" as const,
            count: data.pengajuanPending,
          },
          {
            href: "/laporan-op",
            icon: FileText,
            label: "Laporan Op",
            tone: "primary" as const,
            count: 0,
          },
          {
            href: "/sewa",
            icon: Building2,
            label: "Sewa",
            tone: "success" as const,
            count: 0,
          },
          {
            href: "/dana-cash",
            icon: Banknote,
            label: "Cash",
            tone: "warning" as const,
            count: 0,
          },
        ].map((s) => (
          <a
            key={s.href}
            href={s.href}
            className="rounded-xl border border-border bg-card p-3 flex flex-col items-center gap-1.5 text-xs font-medium hover:bg-accent/50 transition-colors"
          >
            <div className="relative">
              <IconBadge icon={s.icon} tone={s.tone} size="md" />
              {s.count > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground flex items-center justify-center">
                  {s.count}
                </span>
              )}
            </div>
            <span className="text-muted-foreground">{s.label}</span>
          </a>
        ))}
      </div>

      <PageHeader icon={Landmark} title="Yayasan YRBB" />

      {/* Balance sheet panel */}
      <BalanceSheetPanel
        saldo={saldo}
        kewajiban={totalKewajiban}
        danaEfektif={danaEfektif}
        healthRatio={healthRatio}
        healthLabel={health.label}
        healthTone={health.tone}
        displayDate={displayDate ? formatDate(displayDate) : null}
        trend={trend.length >= 2 ? trend.map((t) => t.net) : undefined}
      />

      {/* 2-col: Pengajuan table | Task list */}
      <div className="grid gap-4 md:grid-cols-[1.4fr_1fr]">
        {/* Pengajuan table */}
        {data.pengajuanPending > 0 && (
          <SectionCard
            icon={Clock}
            title="Pengajuan Belum Lunas"
            tone="danger"
            badge={
              <Badge variant="secondary" className="ml-1 tabular-nums">
                {data.pengajuanPending} item · {formatRupiahCompact(data.pengajuanTotalAmount)}
              </Badge>
            }
            action={<NavChevronLink href="/pengajuan" />}
            bodyClassName="p-0"
          >
            <table className="w-full text-sm">
              <tbody>
                {data.pengajuanByRequestor.map((r) => {
                  const pct = Math.round((r.total / pengajuanMax) * 100);
                  return (
                    <tr key={r._id} className="border-t border-border/60 first:border-t-0">
                      <td className="pl-4 py-3 pr-2 w-8">
                        <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-[10px] font-semibold text-muted-foreground shrink-0">
                          {(formatRequestorName(r._id) || "?").slice(0, 2).toUpperCase()}
                        </div>
                      </td>
                      <td className="py-3 px-2 min-w-0">
                        <p className="truncate font-medium">
                          {formatRequestorName(r._id) || "—"}
                        </p>
                        <p className="text-xs text-muted-foreground">{r.count} item</p>
                      </td>
                      <td className="py-3 px-2 hidden sm:table-cell">
                        <div className="h-1.5 rounded-full bg-muted overflow-hidden w-24 md:w-32">
                          <div
                            className="h-full rounded-full bg-primary"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </td>
                      <td className="py-3 pl-2 pr-4 text-right tabular-nums font-semibold whitespace-nowrap">
                        {formatRupiahCompact(r.total)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </SectionCard>
        )}

        {/* Task list */}
        <TaskListPanel
          pengajuanPending={data.pengajuanPending}
          pengajuanTotalAmount={data.pengajuanTotalAmount}
          pendingTransfersCount={pendingTransfers.pending.length}
          pendingTransfersTotal={pendingTransfers.totalExpected}
          errorCount={errorCount}
          warnCount={warnCount}
          reconHasDiff={Boolean(reconHasDiff)}
          reconAmount={reconAmount}
        />
      </div>

      {/* Pending transfers (standalone, if any) */}
      {pendingTransfers.pending.length > 0 && (
        <SectionCard
          icon={Truck}
          title="Menunggu Transfer Masuk"
          tone="warning"
          badge={
            <Badge variant="warning" className="ml-1 tabular-nums">
              {formatRupiahCompact(pendingTransfers.totalExpected)}
            </Badge>
          }
          action={<NavChevronLink href="/sewa" />}
        >
          <div className="divide-y divide-border/60">
            {pendingTransfers.pending.slice(0, 5).map((loc) => (
              <div key={loc.code} className="flex items-center justify-between py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{loc.code}</p>
                  {loc.pipeline?.holder && (
                    <p className="truncate text-xs text-muted-foreground">
                      via {formatRequestorName(loc.pipeline.holder)}
                    </p>
                  )}
                </div>
                <span className="text-sm font-semibold tabular-nums">
                  {formatRupiah(loc.pipeline?.expected_amount ?? loc.amount ?? 0)}
                </span>
              </div>
            ))}
            {pendingTransfers.pending.length > 5 && (
              <p className="pt-2 text-center text-xs text-muted-foreground">
                +{pendingTransfers.pending.length - 5} lainnya
              </p>
            )}
          </div>
        </SectionCard>
      )}

      {/* Bottom 3-col: Rekening | Sewa Dapur | Wajib Bulanan */}
      <div className="grid gap-4 md:grid-cols-[1.3fr_1fr_1fr]">
        {/* Rekening Yayasan */}
        {yayasanAccounts.length > 0 && (
          <SectionCard icon={Wallet} title="Rekening Yayasan" tone="info">
            <div className="divide-y divide-border/60">
              {yayasanAccounts.map((acc) => (
                <div key={acc._id} className="flex items-center justify-between py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{acc.bank}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {formatRequestorName(acc.holder)}
                      {acc.balance_as_of && (
                        <> · per {formatDateShort(acc.balance_as_of)}</>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <p className="text-sm font-bold tabular-nums">{formatRupiah(acc.balance)}</p>
                    {isAdmin && <AccountAdjustButton account={acc} />}
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        )}

        {/* Sewa Dapur */}
        {data.sewa?.sewa && (
          <SectionCard
            icon={Building2}
            title="Sewa Dapur"
            tone="success"
            badge={
              <Badge variant="outline" className="ml-1 tabular-nums">
                {activeCount}/{sewaLocations.length}
              </Badge>
            }
            action={<NavChevronLink href="/sewa" />}
          >
            <div className="space-y-3">
              <div>
                <span className="text-xl font-bold tabular-nums">
                  {formatRupiahCompact(sewaTotal)}
                </span>
                <span className="text-xs text-muted-foreground ml-2">
                  · {activeCount}/{sewaLocations.length} aktif
                </span>
              </div>
              {sewaLocations.length > 0 && (
                <div className="flex gap-1">
                  {sewaLocations.map((loc) => (
                    <div
                      key={loc.code}
                      className={`h-4 flex-1 rounded-sm ${loc.status === "active" ? "bg-success" : "bg-muted"}`}
                      title={loc.code}
                    />
                  ))}
                </div>
              )}
            </div>
          </SectionCard>
        )}

        {/* Wajib Bulanan */}
        {data.wajibBulanan && data.wajibBulanan.length > 0 && (
          <SectionCard
            icon={CalendarDays}
            title="Wajib Bulanan"
            tone="warning"
            badge={
              <Badge variant="warning" className="ml-1 tabular-nums">
                {formatRupiahCompact(wajibTotal)}
              </Badge>
            }
            action={<NavChevronLink href="/wajib-bulanan" />}
          >
            <div className="space-y-3">
              {runway !== null ? (
                <div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold tabular-nums">
                      {runway.toFixed(1).replace(".", ",")}
                    </span>
                    <span className="text-sm font-medium text-muted-foreground">bln runway</span>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Komitmen ≈ {wajibPct}% dari dana efektif
                  </p>
                </div>
              ) : (
                <div>
                  <span className="text-xl font-bold tabular-nums">
                    {formatRupiahCompact(wajibTotal)}
                  </span>
                  <span className="text-xs text-muted-foreground ml-1">/bln</span>
                </div>
              )}
              <div className="divide-y divide-border/60">
                {data.wajibBulanan.map((w) => (
                  <div key={idString(w._id)} className="flex items-center justify-between py-2">
                    <span className="truncate text-xs text-muted-foreground">{w.item}</span>
                    <span className="text-xs font-semibold tabular-nums">
                      {formatRupiahCompact(w.amount ?? 0)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </SectionCard>
        )}
      </div>
    </div>
  );
}
