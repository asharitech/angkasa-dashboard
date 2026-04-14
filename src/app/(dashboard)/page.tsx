import Link from "next/link";
import { getDashboardSummary } from "@/lib/data";
import { formatRupiah, formatShortRupiah, formatDate, formatDateShort } from "@/lib/format";
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
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const data = await getDashboardSummary();

  const op = data.laporanOp?.laporan_op;
  const danaEfektif = op?.dana_efektif ?? 0;
  const saldo = op?.totals?.saldo ?? 0;
  const sewaTotal = data.sewa?.sewa?.total ?? 0;
  const sewaLocations = data.sewa?.sewa?.locations ?? [];
  const activeCount = sewaLocations.filter((l) => l.status === "active").length;

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

      {/* Top summary — yayasan KPIs */}
      <div className="grid grid-cols-2 gap-3">
        <SummaryCard
          title="Dana Efektif"
          value={formatShortRupiah(danaEfektif)}
          subtitle="Setelah kewajiban"
          icon={<Landmark className="h-5 w-5" />}
          iconColor="text-blue-600"
          iconBg="bg-blue-50"
        />
        <SummaryCard
          title="Saldo BTN"
          value={formatShortRupiah(saldo)}
          subtitle="Laporan Op"
          icon={<FileText className="h-5 w-5" />}
          iconColor="text-violet-600"
          iconBg="bg-violet-50"
        />
        <Link href="/sewa">
          <SummaryCard
            title="Sewa Dapur"
            value={formatShortRupiah(sewaTotal)}
            subtitle={`${activeCount}/${sewaLocations.length} aktif`}
            icon={<Building2 className="h-5 w-5" />}
            iconColor="text-teal-600"
            iconBg="bg-teal-50"
          />
        </Link>
        <Link href="/dana-cash">
          <SummaryCard
            title="Cash Yayasan"
            value={formatShortRupiah(data.cashYayasan.sisa)}
            subtitle={`Terpakai ${formatShortRupiah(data.cashYayasan.terpakai)}`}
            icon={<Banknote className="h-5 w-5" />}
            iconColor="text-amber-600"
            iconBg="bg-amber-50"
          />
        </Link>
        <div className="col-span-2">
          <SummaryCard
            title="Pengajuan Belum Lunas"
            value={formatShortRupiah(data.pengajuanTotalAmount)}
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
                  <span className="text-xs font-semibold tabular-nums">{formatShortRupiah(r.total)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

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
                      {acc.holder}
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
