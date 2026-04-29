import { getPemantauan } from "@/lib/data";
import { PageHeader } from "@/components/page-header";
import { KpiStrip, type KpiItem } from "@/components/kpi-strip";
import { SectionCard } from "@/components/section-card";
import { Badge } from "@/components/ui/badge";
import { ClipboardList, MapPin, AlertTriangle, CheckCircle2, Circle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PemantauanDoc } from "@/lib/db/schema";

const HOLDER_ORDER = ["Patta Wellang", "Pak Sandi", "Pak Angkasa"];

function statusKeseluruhanTone(status: string) {
  switch (status) {
    case "aman": return "success";
    case "perlu_perhatian": return "warning";
    case "kritis": return "danger";
    default: return "neutral";
  }
}

function temuanStatusTone(status: string) {
  switch (status) {
    case "selesai": return "success";
    case "sedang": return "info";
    case "belum": return "warning";
    default: return "neutral";
  }
}

function temuanStatusLabel(status: string) {
  switch (status) {
    case "selesai": return "Selesai";
    case "sedang": return "Sedang";
    case "belum": return "Belum";
    default: return status;
  }
}

function formatTanggal(tanggal: string | null | undefined) {
  if (!tanggal) return "—";
  const [y, m, d] = tanggal.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function PemantauanPage() {
  const docs = await getPemantauan();

  const totalLokasi = docs.length;
  const lokasiDenganTemuan = docs.filter((d) => d.temuan && d.temuan.length > 0).length;
  const totalTemuan = docs.reduce((sum, d) => sum + (d.temuan?.length ?? 0), 0);
  const temuanSelesai = docs.reduce(
    (sum, d) => sum + (d.temuan?.filter((t) => t.status === "selesai").length ?? 0),
    0
  );
  const temuanBelum = totalTemuan - temuanSelesai;

  const byHolder = new Map<string, PemantauanDoc[]>();
  for (const doc of docs) {
    if (!byHolder.has(doc.holder)) byHolder.set(doc.holder, []);
    byHolder.get(doc.holder)!.push(doc);
  }

  // Sort holders by predefined order
  const sortedHolders = Array.from(byHolder.entries()).sort((a, b) => {
    const idxA = HOLDER_ORDER.indexOf(a[0]);
    const idxB = HOLDER_ORDER.indexOf(b[0]);
    if (idxA === -1 && idxB === -1) return a[0].localeCompare(b[0]);
    if (idxA === -1) return 1;
    if (idxB === -1) return -1;
    return idxA - idxB;
  });

  const kpis: KpiItem[] = [
    {
      label: "Total Lokasi",
      value: String(totalLokasi),
      icon: MapPin,
      tone: "primary",
    },
    {
      label: "Ada Temuan",
      value: String(lokasiDenganTemuan),
      icon: AlertTriangle,
      tone: "warning",
    },
    {
      label: "Temuan Belum Selesai",
      value: String(temuanBelum),
      icon: Clock,
      tone: "danger",
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader icon={ClipboardList} title="Pemantauan SPPG" />

      <KpiStrip items={kpis} cols={3} />

      {sortedHolders.map(([holder, locations]) => {
        const locWithTemuan = locations.filter((l) => l.temuan && l.temuan.length > 0);
        const locAman = locations.filter((l) => !l.temuan || l.temuan.length === 0);

        return (
          <SectionCard
            key={holder}
            title={holder}
            tone="info"
            badge={
              <span className="text-xs text-muted-foreground tabular-nums">
                {locations.length} lokasi · {locWithTemuan.length} ada temuan
              </span>
            }
          >
            <div className="space-y-3">
              {/* Locations WITH findings */}
              {locWithTemuan.map((loc) => (
                <div
                  key={loc.lokasi_code}
                  className="rounded-lg border border-warning/20 bg-warning/5 p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold">{loc.lokasi_name}</span>
                        <Badge variant="secondary" className="text-[10px]">{loc.bgn_code}</Badge>
                      </div>
                      <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="tabular-nums">{loc.region}</span>
                        {loc.tanggal_pemantauan && (
                          <span className="tabular-nums">
                            · dipantau {formatTanggal(loc.tanggal_pemantauan)}
                          </span>
                        )}
                      </div>
                    </div>
                    <Badge variant={loc.status_keseluruhan === "perlu_perhatian" ? "warning" : loc.status_keseluruhan === "kritis" ? "destructive" : "success"} className="shrink-0 text-xs">
                      {loc.status_keseluruhan === "perlu_perhatian" ? "Perlu Perhatian" : loc.status_keseluruhan === "kritis" ? "Kritis" : "Aman"}
                    </Badge>
                  </div>

                  {/* Temuan list */}
                  <div className="mt-2.5 space-y-1.5">
                    {loc.temuan.map((t, idx) => (
                      <div
                        key={t.id}
                        className="flex items-start gap-2 rounded-md bg-card px-2.5 py-2"
                      >
                        <span className="mt-0.5 text-xs font-medium text-muted-foreground tabular-nums shrink-0">
                          {idx + 1}.
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm leading-snug">{t.deskripsi}</p>
                          {t.catatan && (
                            <p className="mt-0.5 text-xs text-muted-foreground">{t.catatan}</p>
                          )}
                        </div>
                        <Badge variant={t.status === "selesai" ? "success" : t.status === "sedang" ? "info" : "warning"} className="shrink-0 text-[10px]">
                          {temuanStatusLabel(t.status)}
                        </Badge>
                      </div>
                    ))}
                  </div>

                  {/* Kolom belum */}
                  {loc.kolom_belum && loc.kolom_belum.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {loc.kolom_belum.map((k) => (
                        <Badge key={k} variant="outline" className="text-[10px]">
                          {k}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {/* Locations WITHOUT findings (compact) */}
              {locAman.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {locAman.map((loc) => (
                    <div
                      key={loc.lokasi_code}
                      className="flex items-center gap-1.5 rounded-md border border-border/60 bg-muted/30 px-2.5 py-1.5"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0" />
                      <span className="text-sm">{loc.lokasi_name}</span>
                      <Badge variant="secondary" className="text-[10px]">{loc.bgn_code}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </SectionCard>
        );
      })}
    </div>
  );
}
