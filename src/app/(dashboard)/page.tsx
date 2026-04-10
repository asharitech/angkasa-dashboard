import { getDashboardSummary } from "@/lib/data";
import { formatRupiah, formatShortRupiah, formatDateShort } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Landmark,
  Wallet,
  HandCoins,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  Building2,
  Clock,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const data = await getDashboardSummary();

  const danaEfektif = data.laporanOp?.laporan_op?.dana_efektif ?? 0;
  const cashTotal = data.balance?.balance?.cash?.total ?? 0;
  const piutangTotal = data.balance?.balance?.piutang?.total ?? 0;
  const sewaTotal = data.sewa?.sewa?.total ?? 0;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold tracking-tight md:text-2xl">
        Ringkasan Keuangan
      </h2>

      {/* Top summary cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        <SummaryCard
          title="Dana Efektif BTN"
          value={formatShortRupiah(danaEfektif)}
          subtitle="Yayasan"
          icon={<Landmark className="h-5 w-5" />}
          iconColor="text-blue-600"
          iconBg="bg-blue-50"
        />
        <SummaryCard
          title="Dana Pribadi"
          value={formatShortRupiah(cashTotal)}
          subtitle="BCA + BRI kas"
          icon={<Wallet className="h-5 w-5" />}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50"
        />
        <SummaryCard
          title="Piutang"
          value={formatShortRupiah(piutangTotal)}
          subtitle="Belum diganti"
          icon={<HandCoins className="h-5 w-5" />}
          iconColor="text-amber-600"
          iconBg="bg-amber-50"
        />
        <SummaryCard
          title="Pengajuan Pending"
          value={formatShortRupiah(data.pengajuanTotalAmount)}
          subtitle={`${data.pengajuanPending} item`}
          icon={<Clock className="h-5 w-5" />}
          iconColor="text-rose-600"
          iconBg="bg-rose-50"
        />
      </div>

      {/* Accounts */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Landmark className="h-4.5 w-4.5 text-muted-foreground" />
            Rekening
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2.5">
          {data.accounts.map((acc) => (
            <div
              key={acc._id}
              className="flex items-center justify-between rounded-xl bg-muted/50 p-3.5 transition-colors hover:bg-muted/80"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold">{acc.bank}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {acc.holder}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold tabular-nums">
                  {formatRupiah(acc.balance)}
                </p>
                <Badge
                  variant="secondary"
                  className="mt-0.5 text-[10px] font-medium"
                >
                  {acc.type === "yayasan"
                    ? "Yayasan"
                    : acc.type === "personal_transit"
                    ? "Transit"
                    : "Pribadi"}
                </Badge>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Sewa summary */}
      {data.sewa?.sewa && (
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Building2 className="h-4.5 w-4.5 text-muted-foreground" />
              Sewa Dapur
              <Badge variant="secondary" className="ml-auto text-xs font-semibold tabular-nums">
                {formatRupiah(sewaTotal)}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
              {data.sewa.sewa.locations.map((loc) => (
                <div
                  key={loc.code}
                  className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2.5"
                >
                  <span className="text-xs font-semibold">{loc.code}</span>
                  <div className="flex items-center gap-1.5">
                    {loc.status === "active" && loc.days != null && (
                      <span className="text-[11px] text-muted-foreground tabular-nums">
                        {loc.days}h
                      </span>
                    )}
                    <Badge
                      variant={
                        loc.status === "active"
                          ? "default"
                          : loc.status === "running"
                          ? "secondary"
                          : "outline"
                      }
                      className="text-[10px] px-1.5"
                    >
                      {loc.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent transactions */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <ArrowLeftRight className="h-4.5 w-4.5 text-muted-foreground" />
            Transaksi Terakhir
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.recentEntries.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Belum ada transaksi
            </p>
          ) : (
            <div className="space-y-1">
              {data.recentEntries.map((entry) => (
                <div
                  key={entry._id}
                  className="flex items-center justify-between rounded-lg px-1 py-2.5 transition-colors hover:bg-muted/50"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                        entry.direction === "out"
                          ? "bg-rose-50 text-rose-500"
                          : "bg-emerald-50 text-emerald-500"
                      }`}
                    >
                      {entry.direction === "out" ? (
                        <TrendingDown className="h-4 w-4" />
                      ) : (
                        <TrendingUp className="h-4 w-4" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {entry.description}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDateShort(entry.date)} · {entry.category?.replace(/_/g, " ")}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-sm font-semibold tabular-nums shrink-0 ml-3 ${
                      entry.direction === "out"
                        ? "text-rose-600"
                        : "text-emerald-600"
                    }`}
                  >
                    {entry.direction === "out" ? "-" : "+"}
                    {formatShortRupiah(entry.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryCard({
  title,
  value,
  subtitle,
  icon,
  iconColor,
  iconBg,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  iconColor: string;
  iconBg: string;
}) {
  return (
    <Card className="shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <span className="text-xs font-medium text-muted-foreground">
            {title}
          </span>
          <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${iconBg} ${iconColor}`}>
            {icon}
          </div>
        </div>
        <p className="mt-2 text-lg font-bold tabular-nums md:text-xl">
          {value}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
      </CardContent>
    </Card>
  );
}
