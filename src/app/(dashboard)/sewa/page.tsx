import { getLedger, getSewaHistory, getSewaDanaUsage } from "@/lib/data";
import { formatRupiah, formatDateShort } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MiniSummaryCard } from "@/components/summary-card";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import {
  Building2, MapPin, Calendar, DollarSign, StickyNote,
  History, ArrowUpRight, Wallet, BookOpen, AlertTriangle,
} from "lucide-react";

export const dynamic = "force-dynamic";

const regionColors: Record<string, string> = {
  TOPILAUT: "bg-blue-50/60",
  "Rangas Beach": "bg-amber-50/60",
  ANGKASA: "bg-emerald-50/60",
};

// code = real ledgers.sewa.locations[].code in DB. bgn = abbreviation as used in BGN PDFs.
const LOCATION_REFERENCE: { code: string; bgn: string; name: string; region: string; holder: string }[] = [
  { code: "SIMBORO", bgn: "RB", name: "Simboro", region: "TOPILAUT", holder: "Patta Wellang" },
  { code: "DIPO", bgn: "DP", name: "Dipo", region: "TOPILAUT", holder: "Patta Wellang" },
  { code: "KURBAS", bgn: "KB", name: "Kurbas", region: "TOPILAUT", holder: "Patta Wellang" },
  { code: "TAPALANG", bgn: "TPL", name: "Tapalang", region: "TOPILAUT", holder: "Patta Wellang" },
  { code: "KENJE", bgn: "CL", name: "Kenje", region: "TOPILAUT", holder: "Patta Wellang" },
  { code: "SARUDU", bgn: "SRD", name: "Sarudu", region: "Rangas Beach", holder: "Pak Sandi" },
  { code: "BUDONG_BUDONG", bgn: "BDG", name: "Budong-Budong", region: "Rangas Beach", holder: "Pak Sandi" },
  { code: "SAMPAGA", bgn: "SPG", name: "Sampaga", region: "Rangas Beach", holder: "Pak Sandi" },
  { code: "KAROSSA", bgn: "KRS", name: "Karossa", region: "Rangas Beach", holder: "Pak Sandi" },
  { code: "LARA", bgn: "LR", name: "Lara", region: "ANGKASA", holder: "—" },
  { code: "SUMARE", bgn: "SMR", name: "Sumare", region: "ANGKASA", holder: "—" },
];

const stageLabels: Record<string, { label: string; cls: string }> = {
  belum_diterima: { label: "Belum Diterima", cls: "bg-rose-50 text-rose-700 border-rose-200" },
  di_intermediate: { label: "Di Intermediate", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  transfer_yayasan: { label: "Transfer ke Yayasan", cls: "bg-blue-50 text-blue-700 border-blue-200" },
  tercatat: { label: "Tercatat", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
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
              {locations.map((loc) => {
                const stage = loc.pipeline?.stage;
                const stageCfg = stage ? stageLabels[stage] : null;
                const ref = LOCATION_REFERENCE.find((r) => r.code === loc.code);
                const regionMismatch = ref && ref.region !== loc.region;
                return (
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
                      {loc.pipeline?.holder && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          via {loc.pipeline.holder}
                        </p>
                      )}
                      {regionMismatch && ref && (
                        <p className="text-xs text-amber-700 mt-0.5 flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          ref: {ref.name} / {ref.region}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {stageCfg ? (
                        <Badge className={`text-xs border ${stageCfg.cls}`}>
                          {stageCfg.label}
                        </Badge>
                      ) : (
                        <StatusBadge status={loc.status} />
                      )}
                    </div>
                  </div>
                );
              })}
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

      {/* Referensi Kode Lokasi */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-muted-foreground" />
            Referensi Kode Lokasi
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-lg border border-border/60">
            <table className="w-full text-sm">
              <thead className="bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold">Kode DB</th>
                  <th className="px-3 py-2 text-left font-semibold">BGN</th>
                  <th className="px-3 py-2 text-left font-semibold">Nama</th>
                  <th className="px-3 py-2 text-left font-semibold">Region</th>
                  <th className="px-3 py-2 text-left font-semibold">Via</th>
                </tr>
              </thead>
              <tbody>
                {LOCATION_REFERENCE.map((l, i) => (
                  <tr key={l.code} className={i % 2 === 0 ? "bg-background" : "bg-muted/30"}>
                    <td className="px-3 py-2 font-semibold tabular-nums">{l.code}</td>
                    <td className="px-3 py-2 text-muted-foreground tabular-nums">{l.bgn}</td>
                    <td className="px-3 py-2">{l.name}</td>
                    <td className="px-3 py-2 text-muted-foreground">{l.region}</td>
                    <td className="px-3 py-2 text-muted-foreground">{l.holder}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

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
