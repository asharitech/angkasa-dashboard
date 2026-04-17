import Link from "next/link";
import { getDanaCashSummary } from "@/lib/dana-cash";
import { formatRupiah, formatDate } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { PeriodPicker } from "@/components/period-picker";
import { KpiStrip, type KpiItem } from "@/components/kpi-strip";
import { SectionCard } from "@/components/section-card";
import { EmptyState } from "@/components/empty-state";
import { DataTable } from "@/components/data-table";
import { Card, CardContent } from "@/components/ui/card";
import {
  Banknote,
  TrendingDown,
  Wallet,
  ChevronRight,
  Inbox,
  History,
} from "lucide-react";

export const dynamic = "force-dynamic";

type Pengeluaran = { _id: string; date: string; description: string; amount: number };

export default async function DanaCashPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const { period } = await searchParams;
  const summary = await getDanaCashSummary({ period });
  const { saldoAwal, saldoSisa, pengeluaran, pengajuan } = summary;

  const totalTerpakai = period
    ? pengeluaran.reduce((s, e) => s + e.amount, 0)
    : summary.totalTerpakai;
  const displayTerpakai = Math.abs(totalTerpakai);
  const totalAvailable = saldoAwal + Math.max(0, saldoSisa - saldoAwal);
  const pctTerpakai = totalAvailable > 0 ? Math.round((displayTerpakai / totalAvailable) * 100) : 0;

  const kpis: KpiItem[] = [
    { label: "Saldo Awal", value: formatRupiah(saldoAwal), icon: Wallet, tone: "info" },
    {
      label: "Terpakai",
      value: formatRupiah(displayTerpakai),
      icon: TrendingDown,
      tone: "danger",
      hint: `${pctTerpakai}% dari awal`,
    },
    {
      label: "Sisa Cash",
      value: formatRupiah(saldoSisa),
      icon: Banknote,
      tone: "success",
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader title="Cash Yayasan" icon={Banknote} />

      <PeriodPicker basePath="/dana-cash" current={period} />

      <KpiStrip items={kpis} cols={3} />

      {/* Progress */}
      <Card className="shadow-sm">
        <CardContent className="py-3">
          <div className="mb-1.5 flex justify-between text-xs text-muted-foreground">
            <span>
              Terpakai <span className="font-semibold">{formatRupiah(displayTerpakai)}</span>
            </span>
            <span>
              Sisa <span className="font-semibold">{formatRupiah(saldoSisa)}</span>
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-2 rounded-full bg-rose-500/80 transition-all"
              style={{ width: `${Math.min(pctTerpakai, 100)}%` }}
            />
          </div>
        </CardContent>
      </Card>

      <SectionCard
        icon={History}
        title="Riwayat Pengeluaran Cash"
        badge={
          <span className="ml-1 text-xs text-muted-foreground tabular-nums">
            {pengeluaran.length} item
          </span>
        }
        bodyClassName="px-0 md:px-4"
      >
        <DataTable<Pengeluaran>
          minWidth={520}
          rows={pengeluaran}
          rowKey={(r) => r._id}
          empty={
            <EmptyState
              icon={Inbox}
              title="Belum ada pengeluaran"
              description={period ? "Periode terpilih kosong." : "Cash belum digunakan."}
              className="border-none shadow-none"
            />
          }
          columns={[
            {
              key: "date",
              header: "Tanggal",
              cell: (r) => <span className="text-sm tabular-nums">{formatDate(r.date)}</span>,
              className: "w-32",
            },
            {
              key: "desc",
              header: "Keterangan",
              cell: (r) => <span className="text-sm">{r.description}</span>,
            },
            {
              key: "amount",
              header: "Jumlah",
              align: "right",
              cell: (r) => (
                <span className="text-sm font-semibold text-rose-600">
                  {formatRupiah(r.amount)}
                </span>
              ),
            },
          ]}
        />
      </SectionCard>

      {pengajuan.length > 0 && (
        <Link href="/pengajuan" className="block">
          <Card className="shadow-sm transition-colors hover:bg-muted/30">
            <CardContent className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-semibold">Pengajuan dari Cash</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
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
