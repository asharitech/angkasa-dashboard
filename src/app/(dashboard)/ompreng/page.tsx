import { getDb } from "@/lib/mongodb";
import { getSession } from "@/lib/auth";
import { PageHeader } from "@/components/page-header";
import { SectionCard } from "@/components/section-card";
import { KpiStrip, type KpiItem } from "@/components/kpi-strip";
import { OmprengAddButton, OmprengRowActions } from "@/components/ompreng-manager";
import { DAPUR_LOCATIONS, DAPUR_LABELS, type DapurLocation, type OmprengDoc } from "@/lib/ompreng-constants";
import { UtensilsCrossed, LayoutGrid, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

const MONTHS = [
  { value: "2026-01", label: "Jan" },
  { value: "2026-02", label: "Feb" },
  { value: "2026-03", label: "Mar" },
  { value: "2026-04", label: "Apr" },
];

const MONTH_LABELS: Record<string, string> = {
  "2026-01": "Januari 2026",
  "2026-02": "Februari 2026",
  "2026-03": "Maret 2026",
  "2026-04": "April 2026",
};

export default async function OmprengPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const isAdmin = session?.role === "admin";

  const db = await getDb();

  const rawDocs = await db
    .collection("ompreng")
    .find({ month: { $in: MONTHS.map((m) => m.value) } })
    .sort({ month: 1, dapur: 1 })
    .toArray();

  const docs: OmprengDoc[] = rawDocs.map((d) => ({
    _id: d._id.toString(),
    dapur: d.dapur as DapurLocation,
    month: d.month,
    jumlah_ompreng: d.jumlah_ompreng ?? 0,
    jumlah_sasaran: d.jumlah_sasaran ?? 0,
    kekurangan_ompreng: d.kekurangan_ompreng ?? 0,
    alasan_tambah: d.alasan_tambah ?? "",
    notes: d.notes ?? "",
    created_at: d.created_at ?? "",
    updated_at: d.updated_at ?? "",
  }));

  const lookup = new Map<string, OmprengDoc>();
  for (const doc of docs) {
    lookup.set(`${doc.dapur}::${doc.month}`, doc);
  }

  const monthTotals = MONTHS.map((m) => {
    const monthDocs = docs.filter((d) => d.month === m.value);
    return {
      month: m.value,
      label: m.label,
      total_ompreng: monthDocs.reduce((s, d) => s + d.jumlah_ompreng, 0),
      total_sasaran: monthDocs.reduce((s, d) => s + d.jumlah_sasaran, 0),
      total_kekurangan: monthDocs.reduce((s, d) => s + (d.kekurangan_ompreng ?? 0), 0),
    };
  });

  const grandOmpreng = monthTotals.reduce((s, m) => s + m.total_ompreng, 0);
  const grandSasaran = monthTotals.reduce((s, m) => s + m.total_sasaran, 0);

  const grandKekurangan = monthTotals.reduce((s, m) => s + m.total_kekurangan, 0);

  const kpis: KpiItem[] = [
    { label: "Total Ompreng (Jan–Apr)", value: grandOmpreng.toLocaleString("id-ID"), icon: UtensilsCrossed, tone: "info" },
    { label: "Total Sasaran (Jan–Apr)", value: grandSasaran.toLocaleString("id-ID"), icon: Users, tone: "success" },
    { label: "Total Kekurangan (Jan–Apr)", value: grandKekurangan.toLocaleString("id-ID"), icon: UtensilsCrossed, tone: "warning" },
    { label: "Entry Tercatat", value: docs.length.toString(), icon: LayoutGrid, tone: "neutral" },
  ];

  return (
    <main className="content" data-screen-label="08 Ompreng">
      <div className="page-head">
        <div>
          <div className="t-eyebrow" style={{ marginBottom: "var(--sp-2)" }}>Yayasan YRBB · Logistik</div>
          <h1 className="page-head__title">Data Ompreng Dapur</h1>
          <div className="page-head__sub">Monitoring jumlah ompreng dan sasaran penerima</div>
        </div>
        <div className="page-head__actions">
          {isAdmin && <OmprengAddButton />}
        </div>
      </div>

      <div className="sewa-summary">
        <div className="ss-cell">
          <div className="ss-cell__label">Total Ompreng (Jan–Apr)</div>
          <div className="ss-cell__value ss-cell__value--hero">{grandOmpreng.toLocaleString("id-ID")}</div>
        </div>
        <div className="ss-cell">
          <div className="ss-cell__label">Total Sasaran (Jan–Apr)</div>
          <div className="ss-cell__value" style={{ color: "var(--pos-700)" }}>{grandSasaran.toLocaleString("id-ID")}</div>
        </div>
        <div className="ss-cell">
          <div className="ss-cell__label">Total Kekurangan (Jan–Apr)</div>
          <div className="ss-cell__value" style={{ color: "var(--warn-700)" }}>{grandKekurangan.toLocaleString("id-ID")}</div>
        </div>
        <div className="ss-cell">
          <div className="ss-cell__label">Entry Tercatat</div>
          <div className="ss-cell__value">{docs.length}</div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-8)" }}>
        {MONTHS.map((m) => {
          const mt = monthTotals.find((t) => t.month === m.value)!;

          return (
            <section className="section" key={m.value}>
              <div className="section__head">
                <h2 className="section__title">{MONTH_LABELS[m.value]}</h2>
                <span className="section__meta">Ompreng: {mt.total_ompreng.toLocaleString("id-ID")} · Sasaran: {mt.total_sasaran.toLocaleString("id-ID")} {mt.total_kekurangan > 0 && `· Kurang: ${mt.total_kekurangan}`}</span>
              </div>
              <table className="ledger">
                <thead>
                  <tr>
                    <th>Dapur</th>
                    <th className="num" style={{ width: "100px" }}>Ompreng</th>
                    <th className="num" style={{ width: "100px" }}>Sasaran</th>
                    <th className="num" style={{ width: "100px" }}>Kekurangan</th>
                    <th style={{ width: "200px" }}>Alasan Tambah</th>
                    {isAdmin && <th style={{ width: "40px" }} />}
                  </tr>
                </thead>
                <tbody>
                {DAPUR_LOCATIONS.map((dapur) => {
                  const doc = lookup.get(`${dapur}::${m.value}`);
                  return (
                    <tr className={cn(!doc && "opacity-50")} key={dapur}>
                      <td style={{ fontWeight: 600, color: "var(--ink-000)" }}>{DAPUR_LABELS[dapur]}</td>
                      <td className="num">{doc ? doc.jumlah_ompreng.toLocaleString("id-ID") : "—"}</td>
                      <td className="num">{doc ? doc.jumlah_sasaran.toLocaleString("id-ID") : "—"}</td>
                      <td className="num" style={{ color: doc?.kekurangan_ompreng ? "var(--warn-700)" : "inherit" }}>
                        {doc?.kekurangan_ompreng ? doc.kekurangan_ompreng.toLocaleString("id-ID") : "—"}
                      </td>
                      <td style={{ color: "var(--ink-400)", fontSize: "var(--text-xs)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {doc?.alasan_tambah || "—"}
                      </td>
                      {isAdmin && (
                        <td style={{ textAlign: "right" }}>
                          {doc && <OmprengRowActions row={doc} />}
                        </td>
                      )}
                    </tr>
                  );
                })}
                </tbody>
                <tfoot>
                  <tr style={{ fontWeight: 600 }}>
                    <td>Total</td>
                    <td className="num">{mt.total_ompreng.toLocaleString("id-ID")}</td>
                    <td className="num">{mt.total_sasaran.toLocaleString("id-ID")}</td>
                    <td className="num" style={{ color: "var(--warn-700)" }}>
                      {mt.total_kekurangan > 0 ? mt.total_kekurangan.toLocaleString("id-ID") : "—"}
                    </td>
                    <td />
                    {isAdmin && <td />}
                  </tr>
                </tfoot>
              </table>
            </section>
          );
        })}
      </div>
    </main>
  );
}
