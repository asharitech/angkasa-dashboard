import { getDb } from "@/lib/mongodb";
import { dbCollections } from "@/lib/db/collections";
import { getSession } from "@/lib/auth";
import { PageHeader } from "@/components/page-header";
import { SectionCard } from "@/components/section-card";
import { KpiStrip, type KpiItem } from "@/components/kpi-strip";
import { OmprengAddButton, OmprengRowActions } from "@/components/ompreng-manager";
import { DAPUR_LOCATIONS, DAPUR_LABELS, type DapurLocation, type OmprengDoc } from "@/lib/ompreng-constants";
import { monthsInclusiveRange, monthLabel } from "@/lib/periods";
import { UtensilsCrossed, LayoutGrid, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/** Report window for ompreng tables (inclusive). */
const OMPRENG_MONTH_VALUES = monthsInclusiveRange("2026-01", "2026-04");
const MONTHS = OMPRENG_MONTH_VALUES.map((value) => ({
  value,
  labelShort: monthLabel(value, "short"),
  labelLong: monthLabel(value, "long"),
}));

function monthToken(period: string): string {
  return monthLabel(period, "short").split(/\s+/)[0] ?? period;
}

const KPI_RANGE_LABEL = (() => {
  const first = OMPRENG_MONTH_VALUES[0];
  const last = OMPRENG_MONTH_VALUES[OMPRENG_MONTH_VALUES.length - 1];
  const y = first.slice(0, 4);
  return `${monthToken(first)}–${monthToken(last)} ${y}`;
})();

export default async function OmprengPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const isAdmin = session?.role === "admin";

  const c = dbCollections(await getDb());

  const rawDocs = await c.ompreng
    .find({ month: { $in: MONTHS.map((m) => m.value) } })
    .sort({ month: 1, dapur: 1 })
    .toArray();

  const iso = (v: unknown) =>
    v instanceof Date ? v.toISOString() : typeof v === "string" ? v : "";

  const docs: OmprengDoc[] = rawDocs.map((d) => ({
    _id: d._id.toString(),
    dapur: d.dapur as DapurLocation,
    month: d.month,
    jumlah_ompreng: d.jumlah_ompreng ?? 0,
    jumlah_sasaran: d.jumlah_sasaran ?? 0,
    kekurangan_ompreng: d.kekurangan_ompreng ?? 0,
    alasan_tambah: d.alasan_tambah ?? "",
    notes: d.notes ?? "",
    created_at: iso(d.created_at),
    updated_at: iso(d.updated_at),
  }));

  const lookup = new Map<string, OmprengDoc>();
  for (const doc of docs) {
    lookup.set(`${doc.dapur}::${doc.month}`, doc);
  }

  const monthTotals = MONTHS.map((m) => {
    const monthDocs = docs.filter((d) => d.month === m.value);
    return {
      month: m.value,
      label: m.labelShort,
      total_ompreng: monthDocs.reduce((s, d) => s + d.jumlah_ompreng, 0),
      total_sasaran: monthDocs.reduce((s, d) => s + d.jumlah_sasaran, 0),
      total_kekurangan: monthDocs.reduce((s, d) => s + (d.kekurangan_ompreng ?? 0), 0),
    };
  });

  const grandOmpreng = monthTotals.reduce((s, m) => s + m.total_ompreng, 0);
  const grandSasaran = monthTotals.reduce((s, m) => s + m.total_sasaran, 0);

  const grandKekurangan = monthTotals.reduce((s, m) => s + m.total_kekurangan, 0);

  const kpis: KpiItem[] = [
    { label: `Total Ompreng (${KPI_RANGE_LABEL})`, value: grandOmpreng.toLocaleString("id-ID"), icon: UtensilsCrossed, tone: "info" },
    { label: `Total Sasaran (${KPI_RANGE_LABEL})`, value: grandSasaran.toLocaleString("id-ID"), icon: Users, tone: "success" },
    { label: `Total Kekurangan (${KPI_RANGE_LABEL})`, value: grandKekurangan.toLocaleString("id-ID"), icon: UtensilsCrossed, tone: "warning" },
    { label: "Entry Tercatat", value: docs.length.toString(), icon: LayoutGrid, tone: "neutral" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader icon={UtensilsCrossed} title="Data Ompreng Dapur">
        {isAdmin && <OmprengAddButton />}
      </PageHeader>

      <KpiStrip items={kpis} cols={4} />

      {MONTHS.map((m) => {
        const mt = monthTotals.find((t) => t.month === m.value)!;

        return (
          <SectionCard
            key={m.value}
            icon={UtensilsCrossed}
            title={m.labelLong}
            tone="info"
            badge={
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span>Ompreng: <strong className="text-foreground">{mt.total_ompreng.toLocaleString("id-ID")}</strong></span>
                <span>Sasaran: <strong className="text-foreground">{mt.total_sasaran.toLocaleString("id-ID")}</strong></span>
                {mt.total_kekurangan > 0 && (
                  <span>Kurang: <strong className="text-amber-500">{mt.total_kekurangan.toLocaleString("id-ID")}</strong></span>
                )}
              </div>
            }
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/60 text-muted-foreground text-xs">
                    <th className="py-2 pr-4 text-left font-medium">Dapur</th>
                    <th className="py-2 px-4 text-right font-medium">Ompreng</th>
                    <th className="py-2 px-4 text-right font-medium">Sasaran</th>
                    <th className="py-2 px-4 text-right font-medium">Kekurangan</th>
                    <th className="py-2 pl-4 text-left font-medium">Alasan Tambah</th>
                    {isAdmin && <th className="py-2 w-16" />}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {DAPUR_LOCATIONS.map((dapur) => {
                    const doc = lookup.get(`${dapur}::${m.value}`);
                    return (
                      <tr key={dapur} className={cn("transition-colors", !doc && "opacity-40")}>
                        <td className="py-2 pr-4 font-medium">{DAPUR_LABELS[dapur]}</td>
                        <td className="py-2 px-4 text-right tabular-nums">
                          {doc ? doc.jumlah_ompreng.toLocaleString("id-ID") : "—"}
                        </td>
                        <td className="py-2 px-4 text-right tabular-nums">
                          {doc ? doc.jumlah_sasaran.toLocaleString("id-ID") : "—"}
                        </td>
                        <td className="py-2 px-4 text-right tabular-nums">
                          {doc?.kekurangan_ompreng ? (
                            <span className="text-amber-500 font-semibold">{doc.kekurangan_ompreng.toLocaleString("id-ID")}</span>
                          ) : "—"}
                        </td>
                        <td className="py-2 pl-4 text-muted-foreground text-xs max-w-[200px] truncate">
                          {doc?.alasan_tambah || "—"}
                        </td>
                        {isAdmin && (
                          <td className="py-2 text-right">
                            {doc && <OmprengRowActions row={doc} />}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t border-border font-bold text-sm">
                    <td className="py-2 pr-4">Total</td>
                    <td className="py-2 px-4 text-right tabular-nums">{mt.total_ompreng.toLocaleString("id-ID")}</td>
                    <td className="py-2 px-4 text-right tabular-nums">{mt.total_sasaran.toLocaleString("id-ID")}</td>
                    <td className="py-2 px-4 text-right tabular-nums text-amber-500">
                      {mt.total_kekurangan > 0 ? mt.total_kekurangan.toLocaleString("id-ID") : "—"}
                    </td>
                    <td colSpan={isAdmin ? 2 : 1} />
                  </tr>
                </tfoot>
              </table>
            </div>
          </SectionCard>
        );
      })}
    </div>
  );
}
