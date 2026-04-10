import { getLedger } from "@/lib/data";
import { formatRupiah } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const dynamic = "force-dynamic";

export default async function LaporanOpPage() {
  const ledger = await getLedger("laporan_op");

  if (!ledger?.laporan_op) {
    return <p className="text-muted-foreground">Laporan Op belum tersedia.</p>;
  }

  const { entries, totals, kewajiban, dana_efektif } = ledger.laporan_op;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold md:text-xl">
        Laporan Keuangan Operasional
      </h2>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <MiniCard label="Total Masuk" value={formatRupiah(totals.masuk)} color="text-green-600" />
        <MiniCard label="Total Keluar" value={formatRupiah(totals.keluar)} color="text-red-600" />
        <MiniCard label="Saldo" value={formatRupiah(totals.saldo)} />
        <MiniCard label="Dana Efektif" value={formatRupiah(dana_efektif)} color="text-blue-600" />
      </div>

      {/* Kewajiban */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Kewajiban</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-1">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Lembar2 BTN</span>
            <span className="tabular-nums">{formatRupiah(kewajiban.lembar2_btn)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Pinjaman BTN</span>
            <span className="tabular-nums">{formatRupiah(kewajiban.pinjaman_btn)}</span>
          </div>
          <div className="flex justify-between border-t pt-1 font-medium">
            <span>Total Kewajiban</span>
            <span className="tabular-nums">{formatRupiah(kewajiban.total)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Entries table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Detail ({entries.length} item)</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto -mx-4 px-0 md:mx-0 md:px-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">#</TableHead>
                <TableHead>Keterangan</TableHead>
                <TableHead className="text-right">Masuk</TableHead>
                <TableHead className="text-right">Keluar</TableHead>
                <TableHead className="text-right">Saldo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((e) => (
                <TableRow key={e.no}>
                  <TableCell className="text-xs text-muted-foreground">
                    {e.no}
                  </TableCell>
                  <TableCell className="text-xs font-medium max-w-[180px] truncate">
                    {e.keterangan}
                  </TableCell>
                  <TableCell className="text-right text-xs tabular-nums text-green-600">
                    {e.masuk > 0 ? formatRupiah(e.masuk) : ""}
                  </TableCell>
                  <TableCell className="text-right text-xs tabular-nums text-red-600">
                    {e.keluar > 0 ? formatRupiah(e.keluar) : ""}
                  </TableCell>
                  <TableCell className="text-right text-xs tabular-nums font-medium">
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
  color = "",
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <Card>
      <CardContent className="p-3">
        <p className="text-[10px] text-muted-foreground md:text-xs">{label}</p>
        <p className={`mt-0.5 text-sm font-bold tabular-nums ${color}`}>
          {value}
        </p>
      </CardContent>
    </Card>
  );
}
