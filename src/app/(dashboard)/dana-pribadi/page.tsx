import { getDanaPribadiSummary } from "@/lib/data";
import { formatRupiah, formatShortRupiah, formatDate } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SummaryCard } from "@/components/summary-card";
import { PageHeader } from "@/components/page-header";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Wallet,
  Banknote,
  Users,
  ShoppingBag,
  ArrowUpRight,
  ArrowDownLeft,
  PiggyBank,
} from "lucide-react";

export const dynamic = "force-dynamic";

function DirectionBadge({ direction }: { direction: "in" | "out" }) {
  if (direction === "out") {
    return (
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-rose-50">
        <ArrowUpRight className="h-4 w-4 text-rose-500" />
      </div>
    );
  }
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-50">
      <ArrowDownLeft className="h-4 w-4 text-emerald-500" />
    </div>
  );
}

function formatNumpangKey(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default async function DanaPribadiPage() {
  const data = await getDanaPribadiSummary();

  const {
    bcaBalance,
    briKas,
    briEstatement,
    briBersih,
    numpangTotal,
    numpangEntries,
    totalCashBersih,
    personalEntries,
    balance,
  } = data;

  return (
    <div className="space-y-6">
      <PageHeader icon={PiggyBank} title="Dana Pribadi">
        {balance?.as_of && (
          <span className="text-xs text-muted-foreground">
            per {formatDate(balance.as_of)}
          </span>
        )}
      </PageHeader>

      {/* 1. Total Cash Gabungan */}
      <Card className="border-primary/20 bg-primary/5 shadow-sm">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Total Cash Bersih
              </p>
              <p className="mt-1 text-3xl font-bold tabular-nums text-primary">
                {formatRupiah(totalCashBersih)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                BCA + BRI (kas bersih Angkasa)
              </p>
            </div>
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
              <Wallet className="h-7 w-7 text-primary" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. Card BCA + Card BRI */}
      <div className="grid grid-cols-2 gap-3">
        <SummaryCard
          title="BCA"
          value={formatShortRupiah(bcaBalance)}
          subtitle="Dana bersih 100%"
          icon={<Wallet className="h-5 w-5" />}
          iconColor="text-blue-600"
          iconBg="bg-blue-50"
        />
        <SummaryCard
          title="BRI (Total)"
          value={formatShortRupiah(briEstatement > 0 ? briEstatement : briKas + numpangTotal)}
          subtitle={`Kas ${formatShortRupiah(briKas)} + Numpang ${formatShortRupiah(numpangTotal)}`}
          icon={<Banknote className="h-5 w-5" />}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50"
        />
      </div>

      {/* 3. BRI Breakdown */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Banknote className="h-5 w-5 text-muted-foreground" />
            Rincian BRI
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {/* Uang Bersih Pak Angkasa */}
          <div className="rounded-xl bg-emerald-50/60 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-emerald-800">
                  Uang Bersih Pak Angkasa
                </p>
                <p className="mt-0.5 text-xs text-emerald-600">
                  Dari item LUNAS (ANGKASA) di Lembar2
                </p>
              </div>
              <p className="text-lg font-bold tabular-nums text-emerald-700">
                {formatRupiah(briBersih)}
              </p>
            </div>
          </div>

          {/* Uang Numpang */}
          <div className="rounded-xl bg-amber-50/60 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-amber-800">
                  Uang Numpang
                </p>
                <p className="mt-0.5 text-xs text-amber-600">
                  Dana orang lain — bukan milik Angkasa
                </p>
              </div>
              <p className="text-lg font-bold tabular-nums text-amber-700">
                {formatRupiah(numpangTotal)}
              </p>
            </div>
          </div>

          {/* Total */}
          <div className="flex items-center justify-between rounded-lg bg-primary/5 px-4 py-3.5 border border-primary/10">
            <span className="text-sm font-semibold">Estimasi Total BRI</span>
            <span className="text-base font-bold tabular-nums text-primary">
              {formatRupiah(briBersih + numpangTotal)}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* 4. Tabel Rincian Numpang */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Users className="h-5 w-5 text-muted-foreground" />
            Rincian Dana Numpang
            <span className="ml-auto text-sm font-bold tabular-nums text-amber-700">
              {formatRupiah(numpangTotal)}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {numpangEntries.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              Tidak ada dana numpang
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pemilik</TableHead>
                  <TableHead className="text-right">Jumlah</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {numpangEntries.map(({ key, amount }) => (
                  <TableRow key={key}>
                    <TableCell className="font-medium">
                      {formatNumpangKey(key)}
                    </TableCell>
                    <TableCell className="text-right font-semibold tabular-nums text-amber-700">
                      {formatRupiah(amount)}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="border-t-2">
                  <TableCell className="font-bold">Total</TableCell>
                  <TableCell className="text-right font-bold tabular-nums text-amber-700">
                    {formatRupiah(numpangTotal)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 5. Tabel Riwayat Pengeluaran Pribadi */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <ShoppingBag className="h-5 w-5 text-muted-foreground" />
            Riwayat Pengeluaran Pribadi
            <Badge variant="secondary" className="ml-auto text-xs">
              {personalEntries.length} transaksi
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {personalEntries.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              Belum ada transaksi
            </p>
          ) : (
            <>
              {/* Mobile: card list */}
              <div className="space-y-2 md:hidden">
                {personalEntries.map((entry) => (
                  <div
                    key={entry._id}
                    className="flex items-center gap-3 rounded-xl bg-muted/40 p-3"
                  >
                    <DirectionBadge direction={entry.direction} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {entry.description}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(entry.date)} ·{" "}
                        <span className="capitalize">
                          {entry.category?.replace(/_/g, " ")}
                        </span>
                      </p>
                    </div>
                    <p
                      className={`shrink-0 text-sm font-bold tabular-nums ${
                        entry.direction === "out"
                          ? "text-rose-600"
                          : "text-emerald-600"
                      }`}
                    >
                      {entry.direction === "out" ? "-" : "+"}
                      {formatShortRupiah(entry.amount)}
                    </p>
                  </div>
                ))}
              </div>

              {/* Desktop: table */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Keterangan</TableHead>
                      <TableHead>Kategori</TableHead>
                      <TableHead>Akun</TableHead>
                      <TableHead className="text-right">Jumlah</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {personalEntries.map((entry) => (
                      <TableRow key={entry._id}>
                        <TableCell className="text-sm tabular-nums whitespace-nowrap">
                          {formatDate(entry.date)}
                        </TableCell>
                        <TableCell className="max-w-[200px]">
                          <p className="truncate text-sm">{entry.description}</p>
                          {entry.counterparty && (
                            <p className="truncate text-xs text-muted-foreground">
                              {entry.counterparty}
                            </p>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs capitalize">
                            {entry.category?.replace(/_/g, " ")}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground uppercase">
                          {entry.account?.replace(/_/g, " ")}
                        </TableCell>
                        <TableCell className="text-right">
                          <span
                            className={`text-sm font-semibold tabular-nums ${
                              entry.direction === "out"
                                ? "text-rose-600"
                                : "text-emerald-600"
                            }`}
                          >
                            {entry.direction === "out" ? "-" : "+"}
                            {formatRupiah(entry.amount)}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
