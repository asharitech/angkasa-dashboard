import { getPemantauan } from "@/lib/dal";
import { PageHeader } from "@/components/page-header";
import { KpiStrip, type KpiItem } from "@/components/kpi-strip";
import { SectionCard } from "@/components/section-card";
import { PemantauanCard } from "@/components/pemantauan-editor";
import { DashboardPageShell } from "@/components/layout/dashboard-page-shell";
import { ClipboardList, MapPin, AlertTriangle, Clock } from "lucide-react";

export const dynamic = "force-dynamic";

const HOLDER_ORDER = ["Patta Wellang", "Pak Sandi", "Pak Angkasa"];

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

  const byHolder = new Map<string, typeof docs>();
  for (const doc of docs) {
    if (!byHolder.has(doc.holder)) byHolder.set(doc.holder, []);
    byHolder.get(doc.holder)!.push(doc);
  }

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
    <DashboardPageShell>
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
              {locWithTemuan.map((loc) => (
                <PemantauanCard key={loc._id.toString()} doc={{ ...loc, _id: loc._id.toString() }} />
              ))}

              {locAman.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {locAman.map((loc) => (
                    <PemantauanCard key={loc._id.toString()} doc={{ ...loc, _id: loc._id.toString() }} />
                  ))}
                </div>
              )}
            </div>
          </SectionCard>
        );
      })}
    </DashboardPageShell>
  );
}
