import Link from "next/link";
import {
  getDashboardSummary,
  getPendingTransfers,
  getDataIntegrityIssues,
  getLaporanOpReconciliation,
} from "@/lib/data";
import { getSession } from "@/lib/auth";
import { formatRupiah, formatDate, formatDateShort } from "@/lib/format";
import { formatRequestorName } from "@/lib/names";
import { PageHeader } from "@/components/page-header";
import { KpiStrip, type KpiItem } from "@/components/kpi-strip";
import { SectionCard } from "@/components/section-card";
import { StatusBadge } from "@/components/status-badge";
import { AccountAdjustButton } from "@/components/account-adjust-button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Landmark,
  Building2,
  Clock,
  Receipt,
  ChevronRight,
  Banknote,
  Truck,
  ShieldAlert,
  GitCompare,
  Wallet,
  FileText,
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
      label: "Dana Efektif",
      value: formatRupiah(danaEfektif),
      icon: Landmark,
      tone: "info",
      hint:
        totalKewajiban > 0
          ? `Saldo ${formatRupiah(saldo)} − kewajiban ${formatRupiah(totalKewajiban)}`
          : `Saldo ${formatRupiah(saldo)}`,
    },
    {
      label: "Saldo BTN",
      value: formatRupiah(saldo),
      icon: FileText,
      tone: "primary",
      hint: "Per Laporan Op",
      href: "/laporan-op",
    },
    {
      label: "Sewa Aktif",
      value: formatRupiah(sewaTotal),
      icon: Building2,
      tone: "success",
      hint: `${activeCount}/${sewaLocations.length} lokasi`,
      href: "/sewa",
    },
    {
      label: "Cash Yayasan",
      value: formatRupiah(cashSisa),
      icon: Banknote,
      tone: "warning",
      hint: `Terpakai ${formatRupiah(data.cashYayasan.terpakai)}`,
      href: "/dana-cash",
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader icon={Landmark} title="Yayasan YRBB">
        <div className="flex items-center gap-2">
          <Badge
            className={
              health.tone === "success"
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : health.tone === "warning"
                  ? "bg-amber-50 text-amber-700 border-amber-200"
                  : "bg-rose-50 text-rose-700 border-rose-200"
            }
          >
            {health.label}
          </Badge>
          {displayDate && (
            <span className="hidden text-xs text-muted-foreground md:inline">
              per {formatDate(displayDate)}
            </span>
          )}
        </div>
      </PageHeader>

      {/* Combined alert strip — integrity + reconciliation */}
      {(errorCount > 0 || warnCount > 0 || reconHasDiff) && (
        <div className="space-y-2">
          {(errorCount > 0 || warnCount > 0) && (
            <AlertLink
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
            <AlertLink
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
          action={<NavChevron href="/pengajuan" />}
        >
          {data.pengajuanByRequestor.length > 0 ? (
            <div className="grid grid-cols-2 gap-1.5 md:grid-cols-3">
              {data.pengajuanByRequestor.map((r) => (
                <div
                  key={r._id}
                  className="flex items-center justify-between rounded-md bg-muted/40 px-2.5 py-1.5"
                >
                  <span className="truncate text-xs font-medium text-muted-foreground">
                    {formatRequestorName(r._id) || "—"}
                  </span>
                  <span className="ml-2 text-xs font-semibold tabular-nums">
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
          action={<NavChevron href="/sewa" />}
        >
          <div className="space-y-1.5">
            {pendingTransfers.pending.slice(0, 5).map((loc) => (
              <div
                key={loc.code}
                className="flex items-center justify-between rounded-md bg-muted/40 px-3 py-2"
              >
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
              <p className="pt-1 text-center text-xs text-muted-foreground">
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
          action={<NavChevron href="/laporan-op" />}
        >
          <div className="space-y-1.5">
            {kewajibanRows(op.kewajiban).map(([label, val]) => (
              <div
                key={label}
                className="flex items-center justify-between rounded-md bg-muted/40 px-3 py-2"
              >
                <span className="text-sm text-muted-foreground">{label}</span>
                <span className="text-sm font-semibold tabular-nums">{formatRupiah(val)}</span>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* 2-col snapshot: Rekening + Sewa */}
      <div className="grid gap-4 md:grid-cols-2">
        {yayasanAccounts.length > 0 && (
          <SectionCard icon={Wallet} title="Rekening Yayasan" tone="info">
            <div className="space-y-1.5">
              {yayasanAccounts.map((acc) => (
                <div
                  key={acc._id}
                  className="flex items-center justify-between rounded-md bg-muted/40 px-3 py-2"
                >
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
            action={<NavChevron href="/sewa" />}
          >
            <div className="grid grid-cols-2 gap-1.5">
              {sewaLocations.slice(0, 8).map((loc) => (
                <div
                  key={loc.code}
                  className="flex items-center justify-between rounded-md bg-muted/40 px-2.5 py-1.5"
                >
                  <span className="truncate text-xs font-semibold">{loc.code}</span>
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

function NavChevron({ href }: { href: string }) {
  return (
    <Link
      href={href}
      className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
    >
      <ChevronRight className="h-4 w-4" />
    </Link>
  );
}

function AlertLink({
  href,
  tone,
  icon: Icon,
  title,
  hint,
}: {
  href: string;
  tone: "danger" | "warning";
  icon: typeof ShieldAlert;
  title: string;
  hint: string;
}) {
  const cls =
    tone === "danger"
      ? "border-rose-200 bg-rose-50/50 hover:bg-rose-50"
      : "border-amber-200 bg-amber-50/50 hover:bg-amber-50";
  const fg = tone === "danger" ? "text-rose-700" : "text-amber-700";
  return (
    <Link href={href} className="block">
      <Card className={`shadow-sm transition-colors ${cls}`}>
        <CardContent className="flex items-center gap-3 py-2.5">
          <Icon className={`h-4 w-4 ${fg}`} />
          <div className="min-w-0 flex-1">
            <p className={`truncate text-sm font-semibold ${fg}`}>{title}</p>
            <p className="truncate text-xs text-muted-foreground">{hint}</p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </CardContent>
      </Card>
    </Link>
  );
}

function kewajibanRows(k: Record<string, number | undefined>): [string, number][] {
  if (k.dana_pinjam_angkasa_tahap1 != null) {
    return ([
      ["Dana Pinjam Angkasa Tahap 1", k.dana_pinjam_angkasa_tahap1],
      ["Dana Pinjam Angkasa Tahap 2", k.dana_pinjam_angkasa_tahap2],
      ["Dana Pinjam Angkasa Tahap 3", k.dana_pinjam_angkasa_tahap3],
    ] as [string, number | undefined][]).filter((r): r is [string, number] => r[1] != null);
  }
  return ([
    ["Lembar2 BTN", k.lembar2_btn],
    ["Pinjaman BTN", k.pinjaman_btn],
  ] as [string, number | undefined][]).filter((r): r is [string, number] => r[1] != null);
}
