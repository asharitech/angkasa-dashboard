import { getDanaCashSummary } from "@/lib/dana-cash";
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
import { Banknote, TrendingDown, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function DanaCashPage() {
  const { saldoAwal, saldoSisa, totalTerpakai, pengeluaran, pengajuan } =
    await getDanaCashSummary();

  const pctTerpakai = saldoAwal > 0 ? Math.round((totalTerpakai / saldoAwal) * 100) : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dana Cash Yayasan"
        description="Kas tunai yayasan yang dipegang Pak Angkasa"
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <MiniSummaryCard
          title="Saldo Awal"
          value={formatRupiah(saldoAwal)}
          icon={<Wallet className="h-4 w-4 text-muted-foreground" />}
        />
        <MiniSummaryCard
          title="Terpakai"
          value={formatRupiah(totalTerpakai)}
          subtitle={`${pctTerpakai}% dari saldo awal`}
          icon={<TrendingDown className="h-4 w-4 text-destructive" />}
          valueClassName="text-destructive"
        />
        <MiniSummaryCard
          title="Sisa Cash"
          value={formatRupiah(saldoSisa)}
          icon={<Banknote className="h-4 w-4 text-green-600" />}
          valueClassName="text-green-600"
        />
      </div>

      {/* Progress bar */}
      <Card className="shadow-sm">
        <CardContent className="pt-4 pb-4">
          <div className="flex justify-between text-xs text-muted-foreground mb-2">
            <span>Terpakai: {formatRupiah(totalTerpakai)}</span>
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
                      {new Date(e.date).toLocaleDateString("id-ID", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
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

      {/* Pengajuan Pending */}
      {pengajuan.length > 0 && (
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">
              Pengajuan Pending (dari Cash)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Bulan</TableHead>
                  <TableHead className="text-right">Jumlah</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pengajuan.map((o) => (
                  <TableRow key={o._id}>
                    <TableCell className="text-sm">{o.item}</TableCell>
                    <TableCell className="text-sm tabular-nums">{o.month}</TableCell>
                    <TableCell className="text-sm font-semibold tabular-nums text-right">
                      {formatRupiah(o.amount ?? 0)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {o.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
