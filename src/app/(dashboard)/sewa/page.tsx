import { getLedger } from "@/lib/data";
import { formatRupiah } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, MapPin, Calendar, DollarSign, StickyNote } from "lucide-react";

export const dynamic = "force-dynamic";

const statusConfig: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  running: "bg-blue-50 text-blue-700 border-blue-200",
  hold: "bg-amber-50 text-amber-700 border-amber-200",
  inactive: "bg-rose-50 text-rose-700 border-rose-200",
};

const regionConfig: Record<string, { border: string; bg: string }> = {
  TOPILAUT: { border: "border-l-blue-500", bg: "bg-blue-50/50" },
  RB: { border: "border-l-amber-500", bg: "bg-amber-50/50" },
  ANGKASA: { border: "border-l-emerald-500", bg: "bg-emerald-50/50" },
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

  const { sewa } = ledger;

  const byRegion = new Map<string, typeof sewa.locations>();
  for (const loc of sewa.locations) {
    if (!byRegion.has(loc.region)) byRegion.set(loc.region, []);
    byRegion.get(loc.region)!.push(loc);
  }

  const activeCount = sewa.locations.filter((l) => l.status === "active").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold tracking-tight md:text-2xl flex items-center gap-2">
          <Building2 className="h-6 w-6 text-primary" />
          Sewa Dapur
        </h2>
        <Badge variant="secondary" className="font-semibold px-3 py-1.5">
          {ledger.period}
        </Badge>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="shadow-sm">
          <CardContent className="p-4 text-center">
            <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50">
              <DollarSign className="h-5 w-5 text-emerald-600" />
            </div>
            <p className="text-xs font-medium text-muted-foreground">Total</p>
            <p className="text-base font-bold tabular-nums text-emerald-600 mt-1">
              {formatRupiah(sewa.total)}
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4 text-center">
            <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
              <MapPin className="h-5 w-5 text-blue-600" />
            </div>
            <p className="text-xs font-medium text-muted-foreground">Lokasi Aktif</p>
            <p className="text-base font-bold mt-1">
              {activeCount}/{sewa.locations.length}
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4 text-center">
            <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-violet-50">
              <Calendar className="h-5 w-5 text-violet-600" />
            </div>
            <p className="text-xs font-medium text-muted-foreground">Rate/Hari</p>
            <p className="text-base font-bold tabular-nums mt-1">
              {formatRupiah(sewa.rate_per_day)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Locations by region */}
      {Array.from(byRegion.entries()).map(([region, locations]) => {
        const regionTotal = locations.reduce((s, l) => s + (l.amount ?? 0), 0);
        const rc = regionConfig[region] ?? { border: "border-l-gray-400", bg: "bg-muted/50" };
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
                  className={`flex items-center justify-between rounded-xl border-l-4 ${rc.border} ${rc.bg} p-4 transition-colors`}
                >
                  <div>
                    <p className="text-sm font-semibold">{loc.code}</p>
                    {loc.days !== null && loc.days > 0 && (
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {loc.days} hari = {formatRupiah(loc.amount ?? 0)}
                      </p>
                    )}
                  </div>
                  <Badge className={`font-medium border ${statusConfig[loc.status] ?? ""}`}>
                    {loc.status}
                  </Badge>
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
    </div>
  );
}
