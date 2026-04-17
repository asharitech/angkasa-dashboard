import Link from "next/link";
import { getDashboardSummary, getPendingTransfers, getDataIntegrityIssues } from "@/lib/data";
import { formatRupiah, formatShortRupiah, formatDate, formatDateShort } from "@/lib/format";
import { formatRequestorName } from "@/lib/names";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SummaryCard } from "@/components/summary-card";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import {
  Landmark,
  Building2,
  Clock,
  Receipt,
  FileText,
  ChevronRight,
  Banknote,
  Truck,
  ShieldAlert,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [data, pendingTransfers, integrityIssues] = await Promise.all([
    getDashboardSummary(),
    getPendingTransfers(),
    getDataIntegrityIssues(),
  ]);
  const errorCount = integrityIssues.filter((i) => i.severity === "error").length;
  const warnCount = integrityIssues.filter((i) => i.severity === "warn").length;

  const op = data.laporanOp?.laporan_op;
  const danaEfektif = op?.dana_efektif ?? 0;
  const saldo = op?.totals?.saldo ?? 0;
  const totalKewajiban = op?.kewajiban?.total ?? 0;
  const sewaTotal = data.sewa?.sewa?.total ?? 0;
  const sewaLocations = data.sewa?.sewa?.locations ?? [];
  const activeCount = sewaLocations.filter((l) => l.status === "active").length;

  // Financial health calculation
  const netPosition = danaEfektif - totalKewajiban;
  const healthRatio = danaEfektif > 0 ? netPosition / danaEfektif : 0;
  const healthStatus = (() => {
    if (healthRatio >= 0.8) return { label: "Sangat Sehat", color: "emerald", icon: "👍" };
    if (healthRatio >= 0.5) return { label: "Sehat", color: "green", icon: "✅" };
    if (healthRatio >= 0.2) return { label: "Perlu Perhatian", color: "amber", icon: "⚠️" };
    return { label: "Berisiko", color: "red", icon: "🚨" };
  })();

  // Show updated_at if newer than as_of
  const asOf = data.laporanOp?.as_of;
  const updatedAt = data.laporanOp?.updated_at;
  const displayDate = (() => {
    if (!asOf) return updatedAt ?? null;
    if (!updatedAt) return asOf;
    return new Date(updatedAt) > new Date(asOf) ? updatedAt : asOf;
  })();

  return (
    <div className="space-y-6">
      <PageHeader icon={Landmark} title="Yayasan YRBB">
        {displayDate && (
          <span className="text-xs text-muted-foreground">
            per {formatDate(displayDate)}
          </span>
        )}
      </PageHeader>

      {/* Data Integrity Alert */}
      {(errorCount > 0 || warnCount > 0) && (
        <Link href="/audit" className="block">
          <Card className={`shadow-sm border ${errorCount > 0 ? "border-rose-200 bg-rose-50/40 hover:bg-rose-50/70" : "border-amber-200 bg-amber-50/40 hover:bg-amber-50/70"} transition-colors`}>
            <CardContent className="py-3 flex items-center gap-3">
              <ShieldAlert className={`h-5 w-5 ${errorCount > 0 ? "text-rose-600" : "text-amber-600"}`} />
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold ${errorCount > 0 ? "text-rose-700" : "text-amber-700"}`}>
                  {errorCount > 0 ? `${errorCount} isu integritas data` : `${warnCount} peringatan data`}
                </p>
                <p className="text-xs text-muted-foreground">
                  {errorCount > 0 && warnCount > 0
                    ? `${errorCount} error · ${warnCount} warn — review di Audit Data`
                    : errorCount > 0
                      ? "Perlu tindakan segera — review di Audit Data"
                      : "Lihat detail di Audit Data"}
                </p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>
      )}

      {/* Financial Health Indicator */}
      <Card className={`shadow-sm border-2 bg-gradient-to-r ${
        healthStatus.color === 'emerald' ? 'from-emerald-50 to-emerald-100 border-emerald-200' :
        healthStatus.color === 'green' ? 'from-green-50 to-green-100 border-green-200' :
        healthStatus.color === 'amber' ? 'from-amber-50 to-amber-100 border-amber-200' :
        'from-red-50 to-red-100 border-red-200'
      }`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-full text-2xl bg-white/80 ${
                healthStatus.color === 'emerald' ? 'text-emerald-600' :
                healthStatus.color === 'green' ? 'text-green-600' :
                healthStatus.color === 'amber' ? 'text-amber-600' :
                'text-red-600'
              }`}>
                {healthStatus.icon}
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">
                  Status Kesehatan Keuangan: {healthStatus.label}
                </h3>
                <p className="text-sm text-gray-600">
                  Posisi Bersih: <span className="font-bold">{formatRupiah(netPosition)}</span>
                  {healthRatio > 0 ? ' tersedia' : ' defisit'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-500 mb-1">Dana Efektif - Kewajiban</div>
              <div className="text-lg font-mono">
                <span className="text-blue-700">{formatRupiah(danaEfektif)}</span>
                <span className="mx-2 text-gray-400">-</span>
                <span className="text-orange-700">{formatRupiah(totalKewajiban)}</span>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Rasio: {(healthRatio * 100).toFixed(1)}% tersisa
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top summary — yayasan KPIs */}
      <div className="grid grid-cols-2 gap-3">
        <SummaryCard
          title="Dana Efektif"
          value={formatRupiah(danaEfektif)}
          subtitle="Setelah kewajiban"
          icon={<Landmark className="h-5 w-5" />}
          iconColor="text-blue-600"
          iconBg="bg-blue-50"
        />
        <SummaryCard
          title="Saldo BTN"
          value={formatRupiah(saldo)}
          subtitle="Laporan Op"
          icon={<FileText className="h-5 w-5" />}
          iconColor="text-violet-600"
          iconBg="bg-violet-50"
        />
        <Link href="/sewa">
          <SummaryCard
            title="Sewa Dapur"
            value={formatRupiah(sewaTotal)}
            subtitle={`${activeCount}/${sewaLocations.length} aktif`}
            icon={<Building2 className="h-5 w-5" />}
            iconColor="text-teal-600"
            iconBg="bg-teal-50"
          />
        </Link>
        <Link href="/dana-cash">
          <SummaryCard
            title="Cash Yayasan"
            value={formatRupiah(data.cashYayasan.sisa)}
            subtitle={`Terpakai ${formatRupiah(data.cashYayasan.terpakai)}`}
            icon={<Banknote className="h-5 w-5" />}
            iconColor="text-amber-600"
            iconBg="bg-amber-50"
          />
        </Link>
        <div className="col-span-2">
          <SummaryCard
            title="Pengajuan Belum Lunas"
            value={formatRupiah(data.pengajuanTotalAmount)}
            subtitle={`${data.pengajuanPending} item`}
            icon={<Clock className="h-5 w-5" />}
            iconColor="text-rose-600"
            iconBg="bg-rose-50"
          />
          {data.pengajuanByRequestor.length > 0 && (
            <div className="mt-2 space-y-1">
              {data.pengajuanByRequestor.map((r) => (
                <div key={r._id} className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-1.5">
                  <span className="text-xs font-medium text-muted-foreground">{r._id ?? "unknown"}</span>
                  <span className="text-xs font-semibold tabular-nums">{formatRupiah(r.total)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Menunggu Transfer Masuk — sewa locations not yet tercatat */}
      {pendingTransfers.pending.length > 0 && (
        <Link href="/sewa" className="block">
          <Card className="shadow-sm border-amber-200 bg-amber-50/30 hover:bg-amber-50/60 transition-colors">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Truck className="h-5 w-5 text-amber-600" />
                Menunggu Transfer Masuk
                <span className="ml-auto text-sm font-bold tabular-nums text-amber-700">
                  {formatRupiah(pendingTransfers.totalExpected)}
                </span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5">
              {pendingTransfers.pending.slice(0, 5).map((loc) => (
                <div
                  key={loc.code}
                  className="flex items-center justify-between rounded-lg bg-white/60 px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">{loc.code}</p>
                    {loc.pipeline?.holder && (
                      <p className="text-xs text-muted-foreground truncate">
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
                <p className="text-xs text-muted-foreground text-center pt-1">
                  +{pendingTransfers.pending.length - 5} lainnya
                </p>
              )}
            </CardContent>
          </Card>
        </Link>
      )}

      {/* Kewajiban */}
      {op?.kewajiban && op.kewajiban.total > 0 && (
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <Link href="/laporan-op" className="block">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Receipt className="h-5 w-5 text-muted-foreground" />
                Kewajiban
                <span className="ml-auto text-sm font-bold tabular-nums text-rose-600">
                  {formatRupiah(op.kewajiban.total)}
                </span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </CardTitle>
            </Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {op.kewajiban.dana_pinjam_angkasa_tahap1 != null ? (
              <>
                <div className="flex justify-between items-center rounded-lg bg-muted/50 px-4 py-3">
                  <span className="text-sm text-muted-foreground">Dana Pinjam Angkasa Tahap 1</span>
                  <span className="text-sm font-semibold tabular-nums">{formatRupiah(op.kewajiban.dana_pinjam_angkasa_tahap1)}</span>
                </div>
                {op.kewajiban.dana_pinjam_angkasa_tahap2 != null && (
                  <div className="flex justify-between items-center rounded-lg bg-muted/50 px-4 py-3">
                    <span className="text-sm text-muted-foreground">Dana Pinjam Angkasa Tahap 2</span>
                    <span className="text-sm font-semibold tabular-nums">{formatRupiah(op.kewajiban.dana_pinjam_angkasa_tahap2)}</span>
                  </div>
                )}
                {op.kewajiban.dana_pinjam_angkasa_tahap3 != null && (
                  <div className="flex justify-between items-center rounded-lg bg-muted/50 px-4 py-3">
                    <span className="text-sm text-muted-foreground">Dana Pinjam Angkasa Tahap 3</span>
                    <span className="text-sm font-semibold tabular-nums">{formatRupiah(op.kewajiban.dana_pinjam_angkasa_tahap3)}</span>
                  </div>
                )}
              </>
            ) : (
              <>
                {op.kewajiban.lembar2_btn != null && (
                  <div className="flex justify-between items-center rounded-lg bg-muted/50 px-4 py-3">
                    <span className="text-sm text-muted-foreground">Lembar2 BTN</span>
                    <span className="text-sm font-semibold tabular-nums">{formatRupiah(op.kewajiban.lembar2_btn)}</span>
                  </div>
                )}
                {op.kewajiban.pinjaman_btn != null && (
                  <div className="flex justify-between items-center rounded-lg bg-muted/50 px-4 py-3">
                    <span className="text-sm text-muted-foreground">Pinjaman BTN</span>
                    <span className="text-sm font-semibold tabular-nums">{formatRupiah(op.kewajiban.pinjaman_btn)}</span>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Rekening Yayasan */}
      {(() => {
        const yayasanAccounts = data.accounts.filter(
          (acc) => acc.type === "yayasan"
        );
        return yayasanAccounts.length > 0 ? (
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Landmark className="h-5 w-5 text-muted-foreground" />
                Rekening Yayasan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {yayasanAccounts.map((acc) => (
                <div
                  key={acc._id}
                  className="flex items-center justify-between rounded-xl bg-muted/50 p-4"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">{acc.bank}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {formatRequestorName(acc.holder)}
                      {acc.balance_as_of && (
                        <> · per {formatDateShort(acc.balance_as_of)}</>
                      )}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-base font-bold tabular-nums">
                      {formatRupiah(acc.balance)}
                    </p>
                    <Badge variant="secondary" className="mt-1">
                      {acc.type === "yayasan" ? "Yayasan" : "Transit"}
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ) : null;
      })()}

      {/* Sewa summary */}
      {data.sewa?.sewa && (
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <Link href="/sewa" className="block">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Building2 className="h-5 w-5 text-muted-foreground" />
                Sewa Dapur
                <div className="ml-auto flex items-center gap-2">
                  <Badge variant="outline" className="tabular-nums">
                    {activeCount}/{sewaLocations.length} aktif
                  </Badge>
                  <Badge variant="secondary" className="font-semibold tabular-nums">
                    {formatRupiah(sewaTotal)}
                  </Badge>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </CardTitle>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
              {sewaLocations.map((loc) => (
                <div
                  key={loc.code}
                  className="rounded-lg bg-muted/50 px-3.5 py-3 space-y-1.5"
                >
                  <p className="text-sm font-semibold truncate">{loc.code}</p>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={loc.status} />
                    {loc.status === "active" && loc.days != null && (
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {loc.days}h
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
