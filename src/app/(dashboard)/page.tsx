import {
  getDashboardSummary,
  getPendingTransfers,
  getDataIntegrityIssues,
  getLaporanOpReconciliation,
} from "@/lib/data";
import { getSession } from "@/lib/auth";
import { formatRupiah, formatDate, formatDateShort } from "@/lib/format";
import { kewajibanRows } from "@/lib/kewajiban-display";
import { cn, idString } from "@/lib/utils";
import { formatRequestorName } from "@/lib/names";
import { PageHeader } from "@/components/page-header";
import { KpiStrip, type KpiItem } from "@/components/kpi-strip";
import { SectionCard } from "@/components/section-card";
import { StatusBadge } from "@/components/status-badge";
import { AccountAdjustButton } from "@/components/account-adjust-button";
import { InsightLinkCard, NavChevronLink } from "@/components/link-insight";
import { StatRowRupiah } from "@/components/stat-row";
import { Badge } from "@/components/ui/badge";
import {
  Landmark,
  Building2,
  Clock,
  Receipt,
  Banknote,
  Truck,
  ShieldAlert,
  GitCompare,
  Wallet,
  FileText,
  CalendarDays,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [data, pendingTransfers, integrityIssues, recon, session] = await Promise.all([
    getDashboardSummary(),
    getPendingTransfers(),
    getDataIntegrityIssues(),
    getLaporanOpReconciliation(),
    getSession(),
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

  // dana_efektif is already saldo − kewajiban per ledger schema. Do not subtract again.
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

  const kpis: KpiItem[] = [
    {
      label: "Saldo BTN",
      value: formatRupiah(saldo),
      rawAmount: saldo,
      icon: FileText,
      tone: "primary",
      hint: "Per Laporan Op",
      href: "/laporan-op",
      compact: true,
    },
    {
      label: "Sewa Aktif",
      value: formatRupiah(sewaTotal),
      rawAmount: sewaTotal,
      icon: Building2,
      tone: "success",
      hint: `${activeCount}/${sewaLocations.length} lokasi`,
      href: "/sewa",
      compact: true,
    },
    {
      label: "Cash Yayasan",
      value: formatRupiah(cashSisa),
      rawAmount: cashSisa,
      icon: Banknote,
      tone: "warning",
      hint: `Terpakai ${formatRupiah(data.cashYayasan.terpakai)}`,
      href: "/dana-cash",
      compact: true,
    },
    {
      label: "Pengajuan",
      value: String(data.pengajuanPending),
      icon: Receipt,
      tone: "danger",
      hint: data.pengajuanTotalAmount > 0 ? formatRupiah(data.pengajuanTotalAmount) : "Tidak ada pending",
      href: "/pengajuan",
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader icon={Landmark} title="Yayasan YRBB" />

      {/* Hero tile — Dana Efektif */}
      <div className="relative overflow-hidden rounded-xl border border-border bg-gradient-to-br from-primary/5 to-transparent p-5 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-medium text-muted-foreground">Dana Efektif</p>
            <p className="mt-1 text-3xl font-bold tabular-nums md:text-4xl">
              {formatRupiah(danaEfektif)}
            </p>
            {displayDate && (
              <p className="mt-1 text-xs text-muted-foreground">
                per {formatDate(displayDate)}
              </p>
            )}
          </div>
          <div className="shrink-0">
            <span
              className={cn(
                "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold",
                health.tone === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : health.tone === "warning"
                    ? "border-amber-200 bg-amber-50 text-amber-700"
                    : "border-rose-200 bg-rose-50 text-rose-700",
              )}
            >
              {health.label}
            </span>
          </div>
        </div>
        {totalKewajiban > 0 && (
          <p className="mt-2 text-xs text-muted-foreground">
            Saldo {formatRupiah(saldo)} − kewajiban {formatRupiah(totalKewajiban)}
          </p>
        )}
      </div>

      {/* Combined alert strip — integrity + reconciliation */}
      {(errorCount > 0 || warnCount > 0 || reconHasDiff) && (
        <div className="space-y-2">
          {(errorCount > 0 || warnCount > 0) && (
            <InsightLinkCard
              href="/audit"
              tone={errorCount > 0 ? "danger" : "warning"}
              icon={ShieldAlert}
              title={errorCount > 0 ? `${errorCount} isu integritas` : `${warnCount} peringatan`}
              hint={
                errorCount > 0 && warnCount > 0
                  ? `${errorCount} error · ${warnCount} warn`
                  : "Review di Audit Data"
              }
            />
          )}
          {reconHasDiff && (
            <InsightLinkCard
              href="/laporan-op"
              tone="warning"
              icon={GitCompare}
              title="Snapshot Laporan Op tidak sinkron"
              hint={`Selisih ledger vs entries: ${formatRupiah(reconAmount)}`}
            />
          )}
        </div>
      )}

      <KpiStrip items={kpis} cols={4} />

      {/* Pengajuan summary — uses span when in 2-col but inline list */}
      {data.pengajuanPending > 0 && (
        <SectionCard
          icon={Clock}
          title="Pengajuan Belum Lunas"
          tone="danger"
          badge={
            <Badge variant="secondary" className="ml-1 tabular-nums">
              {data.pengajuanPending} item · {formatRupiah(data.pengajuanTotalAmount)}
            </Badge>
          }
          action={<NavChevronLink href="/pengajuan" />}
        >
          {data.pengajuanByRequestor.length > 0 ? (
            <div className="divide-y divide-border/60">
              {data.pengajuanByRequestor.map((r) => (
                <div key={r._id} className="flex items-center justify-between py-2">
                  <span className="truncate text-sm font-medium text-muted-foreground">
                    {formatRequestorName(r._id) || "—"}
                  </span>
                  <span className="ml-2 text-sm font-semibold tabular-nums">
                    {formatRupiah(r.total)}
                  </span>
                </div>
              ))}
            </div>
          ) : null}
        </SectionCard>
      )}

      {/* Pending transfers */}
      {pendingTransfers.pending.length > 0 && (
        <SectionCard
          icon={Truck}
          title="Menunggu Transfer Masuk"
          tone="warning"
          badge={
            <span className="ml-1 text-sm font-bold tabular-nums text-amber-700">
              {formatRupiah(pendingTransfers.totalExpected)}
            </span>
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

      {/* Kewajiban */}
      {op?.kewajiban && op.kewajiban.total > 0 && (
        <SectionCard
          icon={Receipt}
          title="Kewajiban"
          tone="danger"
          badge={
            <span className="ml-1 text-sm font-bold tabular-nums text-rose-600">
              {formatRupiah(op.kewajiban.total)}
            </span>
          }
          action={<NavChevronLink href="/laporan-op" />}
        >
          <div className="divide-y divide-border/60">
            {kewajibanRows(op.kewajiban).map(([label, val]) => (
              <StatRowRupiah key={label} label={label} amount={val} />
            ))}
          </div>
        </SectionCard>
      )}

      {/* Wajib Bulanan Yayasan */}
      {data.wajibBulanan && data.wajibBulanan.length > 0 && (
        <SectionCard
          icon={CalendarDays}
          title="Wajib Bulanan Yayasan"
          tone="warning"
          badge={
            <span className="ml-1 text-sm font-bold tabular-nums text-amber-700">
              {formatRupiah(data.wajibBulanan.reduce((s, w) => s + (w.amount ?? 0), 0))}/bln
            </span>
          }
        >
          <div className="divide-y divide-border/60">
            {data.wajibBulanan.map((w) => (
              <div key={idString(w._id)} className="flex items-center justify-between py-2.5">
                <div className="min-w-0">
                  <span className="truncate text-sm text-muted-foreground">{w.item}</span>
                  {w.category && (
                    <Badge variant="outline" className="ml-2 text-[10px]">
                      {w.category.replace(/_/g, " ")}
                    </Badge>
                  )}
                </div>
                <span className="text-sm font-semibold tabular-nums">{formatRupiah(w.amount ?? 0)}</span>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* 2-col snapshot: Rekening + Sewa */}
      <div className="grid gap-4 md:grid-cols-2">
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
            <div className="divide-y divide-border/60">
              {sewaLocations.slice(0, 8).map((loc) => (
                <div key={loc.code} className="flex items-center justify-between py-2">
                  <span className="truncate text-sm font-semibold">{loc.code}</span>
                  <StatusBadge status={loc.status} size="sm" />
                </div>
              ))}
            </div>
          </SectionCard>
        )}
      </div>
    </div>
  );
}
