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
  Building2,
  AlertCircle,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const data = await getDashboardSummary();

  const btn = data.accounts.find((a) => a._id === "btn_yayasan");
  const bca = data.accounts.find((a) => a._id === "bca_angkasa");
  const bri = data.accounts.find((a) => a._id === "bri_angkasa");

  const danaEfektif = data.laporanOp?.laporan_op?.dana_efektif ?? 0;
  const cashTotal = data.balance?.balance?.cash?.total ?? 0;
  const piutangTotal = data.balance?.balance?.piutang?.total ?? 0;
  const sewaTotal = data.sewa?.sewa?.total ?? 0;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold md:text-xl">Ringkasan Keuangan</h2>

      {/* Top cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <SummaryCard
          title="Dana Efektif BTN"
          value={formatShortRupiah(danaEfektif)}
          subtitle="Yayasan"
          icon={<Landmark className="h-4 w-4 text-blue-500" />}
        />
        <SummaryCard
          title="Dana Pribadi"
          value={formatShortRupiah(cashTotal)}
          subtitle={`BCA + BRI kas`}
          icon={<Wallet className="h-4 w-4 text-green-500" />}
        />
        <SummaryCard
          title="Piutang"
          value={formatShortRupiah(piutangTotal)}
          subtitle="Belum diganti"
          icon={<HandCoins className="h-4 w-4 text-amber-500" />}
        />
        <SummaryCard
          title="Pengajuan Pending"
          value={formatShortRupiah(data.pengajuanTotalAmount)}
          subtitle={`${data.pengajuanPending} item`}
          icon={<AlertCircle className="h-4 w-4 text-red-500" />}
        />
      </div>

      {/* Accounts */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Rekening</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.accounts.map((acc) => (
            <div
              key={acc._id}
              className="flex items-center justify-between rounded-lg border p-3"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium">{acc.bank}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {acc.holder}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold tabular-nums">
                  {formatRupiah(acc.balance)}
                </p>
                <Badge variant="secondary" className="text-[10px]">
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
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Sewa Dapur — {formatRupiah(sewaTotal)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
              {data.sewa.sewa.locations.map((loc) => (
                <div
                  key={loc.code}
                  className="flex items-center justify-between rounded border p-2 text-xs"
                >
                  <span className="font-medium">{loc.code}</span>
                  <div className="flex items-center gap-1">
                    {loc.status === "active" && (
                      <span className="text-muted-foreground">
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
                      className="text-[9px] px-1"
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
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">
            Transaksi Terakhir
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.recentEntries.length === 0 ? (
            <p className="text-sm text-muted-foreground">Belum ada transaksi</p>
          ) : (
            <div className="space-y-2">
              {data.recentEntries.map((entry) => (
                <div
                  key={entry._id}
                  className="flex items-center justify-between py-1.5"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {entry.direction === "out" ? (
                      <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-red-500" />
                    ) : (
                      <ArrowDownLeft className="h-3.5 w-3.5 shrink-0 text-green-500" />
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate">
                        {entry.description}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {formatDateShort(entry.date)} · {entry.category}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-xs font-semibold tabular-nums ${
                      entry.direction === "out"
                        ? "text-red-500"
                        : "text-green-500"
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
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="p-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground md:text-xs">
            {title}
          </span>
          {icon}
        </div>
        <p className="mt-1 text-base font-bold tabular-nums md:text-lg">
          {value}
        </p>
        <p className="text-[10px] text-muted-foreground">{subtitle}</p>
      </CardContent>
    </Card>
  );
}
