import { getLedger } from "@/lib/data";
import { formatRupiah } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MiniSummaryCard } from "@/components/summary-card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TrendingUp, TrendingDown, Scale, Banknote } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function LaporanOpPage() {
  const ledger = await getLedger("laporan_op");

  if (!ledger?.laporan_op) {
    return (
      <p className="text-muted-foreground text-center py-10">
        Laporan Op belum tersedia.
      </p>
    );
  }

  const { entries, totals, kewajiban, dana_efektif } = ledger.laporan_op;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold tracking-tight md:text-2xl">
        Laporan Keuangan Operasional
      </h2>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        <MiniSummaryCard
          title="Total Masuk"
          value={formatRupiah(totals.masuk)}
          icon={<TrendingUp className="h-5 w-5" />}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50"
        />
        <MiniSummaryCard
          title="Total Keluar"
          value={formatRupiah(totals.keluar)}
          icon={<TrendingDown className="h-5 w-5" />}
          iconColor="text-rose-600"
          iconBg="bg-rose-50"
        />
        <MiniSummaryCard
          title="Saldo"
          value={formatRupiah(totals.saldo)}
          icon={<Scale className="h-5 w-5" />}
          iconColor="text-blue-600"
          iconBg="bg-blue-50"
        />
        <MiniSummaryCard
          title="Dana Efektif"
          value={formatRupiah(dana_efektif)}
          icon={<Banknote className="h-5 w-5" />}
          iconColor="text-violet-600"
          iconBg="bg-violet-50"
        />
      </div>

      {/* Kewajiban */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Kewajiban</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between items-center rounded-lg bg-muted/50 px-4 py-3">
            <span className="text-sm text-muted-foreground">Lembar2 BTN</span>
            <span className="text-sm font-semibold tabular-nums">
              {formatRupiah(kewajiban.lembar2_btn)}
            </span>
          </div>
          <div className="flex justify-between items-center rounded-lg bg-muted/50 px-4 py-3">
            <span className="text-sm text-muted-foreground">Pinjaman BTN</span>
            <span className="text-sm font-semibold tabular-nums">
              {formatRupiah(kewajiban.pinjaman_btn)}
            </span>
          </div>
          <div className="flex justify-between items-center rounded-lg bg-primary/5 px-4 py-3.5 border border-primary/10">
            <span className="text-sm font-semibold">Total Kewajiban</span>
            <span className="text-base font-bold tabular-nums text-primary">
              {formatRupiah(kewajiban.total)}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Entries table */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">
            Detail Transaksi
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              ({entries.length} item)
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto px-0 md:px-5">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-14">#</TableHead>
                <TableHead>Keterangan</TableHead>
                <TableHead className="text-right">Masuk</TableHead>
                <TableHead className="text-right">Keluar</TableHead>
                <TableHead className="text-right">Saldo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((e) => (
                <TableRow key={e.no} className="hover:bg-muted/50">
                  <TableCell className="text-sm text-muted-foreground font-medium">
                    {e.no}
                  </TableCell>
                  <TableCell className="text-sm font-medium max-w-[220px] truncate">
                    {e.keterangan}
                  </TableCell>
                  <TableCell className="text-right text-sm tabular-nums text-emerald-600 font-semibold">
                    {e.masuk > 0 ? formatRupiah(e.masuk) : ""}
                  </TableCell>
                  <TableCell className="text-right text-sm tabular-nums text-rose-600 font-semibold">
                    {e.keluar > 0 ? formatRupiah(e.keluar) : ""}
                  </TableCell>
                  <TableCell className="text-right text-sm tabular-nums font-bold">
                    {formatRupiah(e.saldo)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

