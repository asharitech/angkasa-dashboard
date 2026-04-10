import { getLedger } from "@/lib/data";
import { formatRupiah } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
        <MiniCard
          label="Total Masuk"
          value={formatRupiah(totals.masuk)}
          icon={<TrendingUp className="h-5 w-5" />}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50"
        />
        <MiniCard
          label="Total Keluar"
          value={formatRupiah(totals.keluar)}
          icon={<TrendingDown className="h-5 w-5" />}
          iconColor="text-rose-600"
          iconBg="bg-rose-50"
        />
        <MiniCard
          label="Saldo"
          value={formatRupiah(totals.saldo)}
          icon={<Scale className="h-5 w-5" />}
          iconColor="text-blue-600"
          iconBg="bg-blue-50"
        />
        <MiniCard
          label="Dana Efektif"
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
          <div className="flex justify-between items-center rounded-lg bg-muted/50 px-3.5 py-2.5">
            <span className="text-sm text-muted-foreground">Lembar2 BTN</span>
            <span className="text-sm font-semibold tabular-nums">
              {formatRupiah(kewajiban.lembar2_btn)}
            </span>
          </div>
          <div className="flex justify-between items-center rounded-lg bg-muted/50 px-3.5 py-2.5">
            <span className="text-sm text-muted-foreground">Pinjaman BTN</span>
            <span className="text-sm font-semibold tabular-nums">
              {formatRupiah(kewajiban.pinjaman_btn)}
            </span>
          </div>
          <div className="flex justify-between items-center rounded-lg bg-primary/5 px-3.5 py-3 border border-primary/10">
            <span className="text-sm font-semibold">Total Kewajiban</span>
            <span className="text-sm font-bold tabular-nums text-primary">
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
            <span className="ml-2 text-xs font-normal text-muted-foreground">
              {entries.length} item
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto -mx-4 px-0 md:mx-0 md:px-4">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-12 text-xs">#</TableHead>
                <TableHead className="text-xs">Keterangan</TableHead>
                <TableHead className="text-right text-xs">Masuk</TableHead>
                <TableHead className="text-right text-xs">Keluar</TableHead>
                <TableHead className="text-right text-xs">Saldo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((e) => (
                <TableRow key={e.no} className="hover:bg-muted/50">
                  <TableCell className="text-xs text-muted-foreground font-medium">
                    {e.no}
                  </TableCell>
                  <TableCell className="text-sm font-medium max-w-[200px] truncate">
                    {e.keterangan}
                  </TableCell>
                  <TableCell className="text-right text-sm tabular-nums text-emerald-600 font-medium">
                    {e.masuk > 0 ? formatRupiah(e.masuk) : ""}
                  </TableCell>
                  <TableCell className="text-right text-sm tabular-nums text-rose-600 font-medium">
                    {e.keluar > 0 ? formatRupiah(e.keluar) : ""}
                  </TableCell>
                  <TableCell className="text-right text-sm tabular-nums font-semibold">
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

function MiniCard({
  label,
  value,
  icon,
  iconColor,
  iconBg,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  iconColor: string;
  iconBg: string;
}) {
  return (
    <Card className="shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <span className="text-xs font-medium text-muted-foreground">{label}</span>
          <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${iconBg} ${iconColor}`}>
            {icon}
          </div>
        </div>
        <p className="mt-2 text-base font-bold tabular-nums md:text-lg">
          {value}
        </p>
      </CardContent>
    </Card>
  );
}
