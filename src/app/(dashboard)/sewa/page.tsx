import { getLedger } from "@/lib/data";
import { formatRupiah } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

const statusColor: Record<string, string> = {
  active: "bg-green-100 text-green-800",
  running: "bg-blue-100 text-blue-800",
  hold: "bg-amber-100 text-amber-800",
  inactive: "bg-red-100 text-red-800",
};

const regionColor: Record<string, string> = {
  TOPILAUT: "border-l-blue-500",
  RB: "border-l-amber-500",
  ANGKASA: "border-l-green-500",
};

export default async function SewaPage() {
  const ledger = await getLedger("sewa");

  if (!ledger?.sewa) {
    return <p className="text-muted-foreground">Data sewa belum tersedia.</p>;
  }

  const { sewa } = ledger;

  // Group by region
  const byRegion = new Map<string, typeof sewa.locations>();
  for (const loc of sewa.locations) {
    if (!byRegion.has(loc.region)) byRegion.set(loc.region, []);
    byRegion.get(loc.region)!.push(loc);
  }

  const activeCount = sewa.locations.filter((l) => l.status === "active").length;
  const totalDays = sewa.locations.reduce((s, l) => s + (l.days ?? 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold md:text-xl">Sewa Dapur</h2>
        <Badge variant="secondary" className="text-xs">
          Periode: {ledger.period}
        </Badge>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-[10px] text-muted-foreground">Total</p>
            <p className="text-sm font-bold tabular-nums text-green-600">
              {formatRupiah(sewa.total)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-[10px] text-muted-foreground">Lokasi Aktif</p>
            <p className="text-sm font-bold">{activeCount}/{sewa.locations.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-[10px] text-muted-foreground">Rate/Hari</p>
            <p className="text-sm font-bold tabular-nums">
              {formatRupiah(sewa.rate_per_day)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Locations by region */}
      {Array.from(byRegion.entries()).map(([region, locations]) => {
        const regionTotal = locations.reduce((s, l) => s + (l.amount ?? 0), 0);
        return (
          <Card key={region}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-sm">
                <span>{region}</span>
                <span className="text-xs font-normal text-muted-foreground">
                  {formatRupiah(regionTotal)}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {locations.map((loc) => (
                <div
                  key={loc.code}
                  className={`flex items-center justify-between rounded border-l-4 p-2.5 ${
                    regionColor[region] ?? "border-l-gray-300"
                  }`}
                >
                  <div>
                    <p className="text-xs font-medium">{loc.code}</p>
                    {loc.days !== null && loc.days > 0 && (
                      <p className="text-[10px] text-muted-foreground">
                        {loc.days} hari = {formatRupiah(loc.amount ?? 0)}
                      </p>
                    )}
                  </div>
                  <Badge
                    className={`text-[9px] ${statusColor[loc.status] ?? ""}`}
                    variant="secondary"
                  >
                    {loc.status}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        );
      })}

      {sewa.notes && Object.keys(sewa.notes).length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Catatan</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground space-y-1">
            {Object.entries(sewa.notes).map(([key, val]) => (
              <p key={key}>
                <span className="font-medium capitalize">{key}:</span> {val}
              </p>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
