import { getLedger, getSewaHistory, getSewaDanaUsage } from "@/lib/data";
import { formatRupiah, formatDateShort } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MiniSummaryCard } from "@/components/summary-card";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import {
  Building2, MapPin, Calendar, DollarSign, StickyNote,
  History, ArrowUpRight, Wallet,
} from "lucide-react";

export const dynamic = "force-dynamic";

const regionColors: Record<string, string> = {
  TOPILAUT: "bg-blue-50/60",
  "Rangas Beach": "bg-amber-50/60",
  ANGKASA: "bg-emerald-50/60",
};

export default async function SewaPage() {
  const [ledger, sewaHistory, danaSewa] = await Promise.all([
    getLedger("sewa"),
    getSewaHistory(),
    getSewaDanaUsage(),
  ]);

  if (!ledger?.sewa) {
    return (
      <div className="space-y-6">
        <PageHeader icon={Building2} title="Sewa Dapur" />
        <p className="text-muted-foreground text-center py-10">
          Data sewa belum tersedia.
        </p>
      </div>
    );
  }

  const { sewa } = ledger;

  const byRegion = new Map<string, typeof sewa.locations>();
  for (const loc of sewa.locations) {
    if (!byRegion.has(loc.region)) byRegion.set(loc.region, []);
    byRegion.get(loc.region)!.push(loc);
  }

  const activeCount = sewa.locations.filter((l) => l.status === "active").length;
  const sisaPct = danaSewa.totalMasuk > 0
    ? Math.round((danaSewa.sisaDana / danaSewa.totalMasuk) * 100)
    : 100;

  return (
    <div className="space-y-6">
      <PageHeader icon={Building2} title="Sewa Dapur">
        <Badge variant="secondary" className="font-semibold px-3 py-1.5">
          {ledger.period}
        </Badge>
      </PageHeader>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <MiniSummaryCard
          title="Total Sewa"
          value={formatRupiah(sewa.total)}
          icon={<DollarSign className="h-5 w-5" />}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50"
          valueColor="text-emerald-600"
        />
        <MiniSummaryCard
          title="Lokasi Aktif"
          value={`${activeCount}/${sewa.locations.length}`}
          icon={<MapPin className="h-5 w-5" />}
          iconColor="text-blue-600"
          iconBg="bg-blue-50"
        />
        <MiniSummaryCard
          title="Rate/Hari/Lok"
          value={formatRupiah(sewa.rate_per_day)}
          icon={<Calendar className="h-5 w-5" />}
          iconColor="text-violet-600"
          iconBg="bg-violet-50"
        />
      </div>

      {/* Lokasi per region */}
      {Array.from(byRegion.entries()).map(([region, locations]) => {
        const regionTotal = locations.reduce((s, l) => s + (l.amount ?? 0), 0);
        const bg = regionColors[region] ?? "bg-muted/50";
        return (
          <Card key={region} className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-base">
                <span className="font-semibold">{region}</span>
                <span className="text-sm font-semibold text-muted-foreground tabular-nums">
                  {formatRupiah(regionTotal)}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {locations.map((loc) => (
                <div
                  key={loc.code}
                  className={`flex items-center justify-between gap-3 rounded-xl ${bg} p-4`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold truncate">{loc.code}</p>
                    {loc.days !== null && loc.days > 0 && (
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {loc.days} hari = {formatRupiah(loc.amount ?? 0)}
                      </p>
                    )}
                  </div>
                  <StatusBadge status={loc.status} />
                </div>
              ))}
            </CardContent>
          </Card>
        );
      })}

      {/* Dana Operasional dari Sewa */}
      <Card className="shadow-sm border-orange-100">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Wallet className="h-5 w-5 text-orange-500" />
            Dana Operasional dari Sewa
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Summary bar */}
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-xl bg-emerald-50 p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">Masuk</p>
              <p className="text-sm font-bold text-emerald-700 tabular-nums">
                {formatRupiah(danaSewa.totalMasuk)}
              </p>
            </div>
            <div className="rounded-xl bg-red-50 p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">Terpakai</p>
              <p className="text-sm font-bold text-red-600 tabular-nums">
                {formatRupiah(danaSewa.totalTerpakai)}
              </p>
            </div>
            <div className="rounded-xl bg-blue-50 p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">Sisa ({sisaPct}%)</p>
              <p className="text-sm font-bold text-blue-700 tabular-nums">
                {formatRupiah(danaSewa.sisaDana)}
              </p>
            </div>
          </div>

          {/* Progress bar */}
          {danaSewa.totalMasuk > 0 && (
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-red-400 h-2 rounded-full transition-all"
                style={{
                  width: `${Math.min(100, Math.round((danaSewa.totalTerpakai / danaSewa.totalMasuk) * 100))}%`,
                }}
              />
            </div>
          )}

          {/* Sewa masuk — dihapus, pakai total dari ledger */}

          {/* Pengeluaran dari sewa */}
          {danaSewa.pengeluaranSewa.length > 0 ? (
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Pengeluaran dari Dana Sewa
              </p>
              {danaSewa.pengeluaranSewa.map((e) => (
                <div
                  key={e._id}
                  className="flex items-center justify-between gap-3 rounded-xl bg-red-50/60 p-3"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <ArrowUpRight className="h-4 w-4 text-red-500 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{e.counterparty}</p>
                      <p className="text-xs text-muted-foreground truncate">{e.description}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-red-600 tabular-nums">
                      -{formatRupiah(e.amount)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDateShort(e.date)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-2">
              Belum ada pengeluaran dari dana sewa
            </p>
          )}
        </CardContent>
      </Card>

      {/* Notes */}
      {sewa.notes && Object.keys(sewa.notes).length > 0 && (
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <StickyNote className="h-5 w-5 text-muted-foreground" />
              Catatan
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(sewa.notes).map(([key, val]) => (
              <p key={key} className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground capitalize">{key}:</span>{" "}
                {val}
              </p>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Riwayat Tahap */}
      {sewaHistory.length > 1 && (
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <History className="h-5 w-5 text-muted-foreground" />
              Riwayat Tahap
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {sewaHistory.map((h) => (
              <div
                key={h._id}
                className={`flex items-center justify-between rounded-xl p-4 ${
                  h.is_current ? "bg-primary/5 border border-primary/10" : "bg-muted/50"
                }`}
              >
                <div>
                  <p className="text-sm font-semibold">
                    {h.period}
                    {h.is_current && (
                      <Badge variant="secondary" className="ml-2 text-xs">aktif</Badge>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Update: {formatDateShort(h.updated_at)}
                  </p>
                </div>
                <span className="text-sm font-bold tabular-nums">
                  {formatRupiah(h.sewa?.total ?? 0)}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
