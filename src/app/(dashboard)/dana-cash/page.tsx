import Link from "next/link";
import { getDanaCashSummary } from "@/lib/dana-cash";
import { formatRupiah, formatDate } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MiniSummaryCard } from "@/components/summary-card";
import { PageHeader } from "@/components/page-header";
import { PeriodPicker } from "@/components/period-picker";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Banknote, TrendingDown, Wallet, ChevronRight } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DanaCashPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const { period } = await searchParams;
  const summary = await getDanaCashSummary({ period });
  const { saldoAwal, saldoSisa, pengeluaran, pengajuan } = summary;

  // When a period filter is active, "Terpakai" reflects spending in that period only;
  // otherwise it's all-time (saldoAwal − saldoSisa).
  const totalTerpakai = period
    ? pengeluaran.reduce((s, e) => s + e.amount, 0)
    : summary.totalTerpakai;

  // Fix: Use absolute value for display and calculate percentage based on total available funds
  const displayTerpakai = Math.abs(totalTerpakai);
  const totalAvailable = saldoAwal + Math.max(0, saldoSisa - saldoAwal); // Initial + any additional income
  const pctTerpakai = totalAvailable > 0 ? Math.round((displayTerpakai / totalAvailable) * 100) : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cash Yayasan"
        icon={Banknote}
      />

      <PeriodPicker basePath="/dana-cash" current={period} />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MiniSummaryCard
          title="Saldo Awal"
          value={formatRupiah(saldoAwal)}
          icon={<Wallet className="h-4 w-4" />}
          iconColor="text-blue-600"
          iconBg="bg-blue-100"
        />
        <MiniSummaryCard
          title="Terpakai"
          value={formatRupiah(displayTerpakai)}
          icon={<TrendingDown className="h-4 w-4" />}
          iconColor="text-red-600"
          iconBg="bg-red-100"
          valueColor="text-red-600"
        />
        <MiniSummaryCard
          title="Sisa Cash"
          value={formatRupiah(saldoSisa)}
          icon={<Banknote className="h-4 w-4" />}
          iconColor="text-green-600"
          iconBg="bg-green-100"
          valueColor="text-green-600"
        />
      </div>

      {/* Progress bar */}
      <Card className="shadow-sm">
        <CardContent className="pt-4 pb-4">
          <div className="flex justify-between text-xs text-muted-foreground mb-2">
            <span>Terpakai: {formatRupiah(displayTerpakai)}</span>
            <span>Sisa: {formatRupiah(saldoSisa)}</span>
          </div>
          <div className="w-full bg-muted rounded-full h-3">
            <div
              className="bg-destructive h-3 rounded-full transition-all"
              style={{ width: `${Math.min(pctTerpakai, 100)}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Riwayat Pengeluaran */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Riwayat Pengeluaran Cash</CardTitle>
        </CardHeader>
        <CardContent>
          {pengeluaran.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Belum ada pengeluaran
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Keterangan</TableHead>
                  <TableHead className="text-right">Jumlah</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pengeluaran.map((e) => (
                  <TableRow key={e._id}>
                    <TableCell className="text-sm tabular-nums">
                      {formatDate(e.date)}
                    </TableCell>
                    <TableCell className="text-sm">{e.description}</TableCell>
                    <TableCell className="text-sm font-semibold tabular-nums text-right text-destructive">
                      {formatRupiah(e.amount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pengajuan dari cash — link only, detail di /pengajuan */}
      {pengajuan.length > 0 && (
        <Link href="/pengajuan" className="block">
          <Card className="shadow-sm hover:bg-muted/30 transition-colors">
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="text-sm font-semibold">Pengajuan dari Cash</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {pengajuan.length} item belum lunas ·{" "}
                  {formatRupiah(pengajuan.reduce((s, o) => s + (o.amount ?? 0), 0))}
                </p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>
      )}
    </div>
  );
}
