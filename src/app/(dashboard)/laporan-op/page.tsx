import { getLedger } from "@/lib/data";
import { formatRupiah } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MiniSummaryCard } from "@/components/summary-card";
import { PageHeader } from "@/components/page-header";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FileText, TrendingUp, TrendingDown, Scale, Banknote } from "lucide-react";

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
      <PageHeader icon={FileText} title="Laporan Keuangan Operasional">
        {ledger.as_of && (
          <span className="text-xs text-muted-foreground">
            per {new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" }).format(new Date(ledger.as_of))}
          </span>
        )}
      </PageHeader>

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
          {(kewajiban as { dana_pinjam_angkasa_tahap1?: number }).dana_pinjam_angkasa_tahap1 != null ? (
            <>
              <div className="flex justify-between items-center rounded-lg bg-muted/50 px-4 py-3">
                <span className="text-sm text-muted-foreground">Dana Pinjam Angkasa Tahap 1</span>
                <span className="text-sm font-semibold tabular-nums">
                  {formatRupiah((kewajiban as { dana_pinjam_angkasa_tahap1: number }).dana_pinjam_angkasa_tahap1)}
                </span>
              </div>
              {(kewajiban as { dana_pinjam_angkasa_tahap2?: number }).dana_pinjam_angkasa_tahap2 != null && (
                <div className="flex justify-between items-center rounded-lg bg-muted/50 px-4 py-3">
                  <span className="text-sm text-muted-foreground">Dana Pinjam Angkasa Tahap 2</span>
                  <span className="text-sm font-semibold tabular-nums">
                    {formatRupiah((kewajiban as { dana_pinjam_angkasa_tahap2: number }).dana_pinjam_angkasa_tahap2)}
                  </span>
                </div>
              )}
              {(kewajiban as { dana_pinjam_angkasa_tahap3?: number }).dana_pinjam_angkasa_tahap3 != null && (
                <div className="flex justify-between items-center rounded-lg bg-muted/50 px-4 py-3">
                  <span className="text-sm text-muted-foreground">Dana Pinjam Angkasa Tahap 3</span>
                  <span className="text-sm font-semibold tabular-nums">
                    {formatRupiah((kewajiban as { dana_pinjam_angkasa_tahap3: number }).dana_pinjam_angkasa_tahap3)}
                  </span>
                </div>
              )}
            </>
          ) : (
            <>
              {(kewajiban as { lembar2_btn?: number }).lembar2_btn != null && (
                <div className="flex justify-between items-center rounded-lg bg-muted/50 px-4 py-3">
                  <span className="text-sm text-muted-foreground">Lembar2 BTN</span>
                  <span className="text-sm font-semibold tabular-nums">
                    {formatRupiah((kewajiban as { lembar2_btn: number }).lembar2_btn)}
                  </span>
                </div>
              )}
              {(kewajiban as { pinjaman_btn?: number }).pinjaman_btn != null && (
                <div className="flex justify-between items-center rounded-lg bg-muted/50 px-4 py-3">
                  <span className="text-sm text-muted-foreground">Pinjaman BTN</span>
                  <span className="text-sm font-semibold tabular-nums">
                    {formatRupiah((kewajiban as { pinjaman_btn: number }).pinjaman_btn)}
                  </span>
                </div>
              )}
            </>
          )}
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
          <p className="text-xs text-muted-foreground mt-1">
            Sequential ledger entries for period ending {ledger.as_of ? new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" }).format(new Date(ledger.as_of)) : 'N/A'} • Entries are chronologically ordered by transaction sequence
          </p>
        </CardHeader>
        <CardContent className="overflow-x-auto px-0 md:px-5">
          <Table>
            <TableHeader className="sticky top-0 bg-card z-10">
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
                  <TableCell className="text-sm font-medium whitespace-normal break-words md:max-w-[220px] md:truncate">
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
