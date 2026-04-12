import { getLedger, getSewaHistory } from "@/lib/data";
import { formatRupiah } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MiniSummaryCard } from "@/components/summary-card";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { formatDateShort } from "@/lib/format";
import { Building2, MapPin, Calendar, DollarSign, StickyNote, History } from "lucide-react";

export const dynamic = "force-dynamic";

const regionColors: Record<string, string> = {
  TOPILAUT: "bg-blue-50/60",
  RB: "bg-amber-50/60",
  ANGKASA: "bg-emerald-50/60",
};

export default async function SewaPage() {
  const ledger = await getLedger("sewa");

  if (!ledger?.sewa) {
    return (
      <p className="text-muted-foreground text-center py-10">
        Data sewa belum tersedia.
      </p>
    );
  }

  const sewaHistory = await getSewaHistory();
  const { sewa } = ledger;

  const byRegion = new Map<string, typeof sewa.locations>();
  for (const loc of sewa.locations) {
    if (!byRegion.has(loc.region)) byRegion.set(loc.region, []);
    byRegion.get(loc.region)!.push(loc);
  }

  const activeCount = sewa.locations.filter((l) => l.status === "active").length;

  return (
    <div className="space-y-6">
      <PageHeader icon={Building2} title="Sewa Dapur">
        <Badge variant="secondary" className="font-semibold px-3 py-1.5">
          {ledger.period}
        </Badge>
      </PageHeader>

      <div className="grid grid-cols-3 gap-3">
        <MiniSummaryCard
          title="Total"
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
          title="Rate/Hari"
          value={formatRupiah(sewa.rate_per_day)}
          icon={<Calendar className="h-5 w-5" />}
          iconColor="text-violet-600"
          iconBg="bg-violet-50"
        />
      </div>

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

      {/* Sewa History */}
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
