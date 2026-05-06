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
import { redirect } from "next/navigation";
import { DashboardPageShell } from "@/components/layout/dashboard-page-shell";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { TableRow, TableCell } from "@/components/ui/table";

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

type OmprengMonthRow = { dapur: DapurLocation; doc: OmprengDoc | undefined };

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
    <DashboardPageShell>
      <PageHeader icon={UtensilsCrossed} title="Data Ompreng Dapur">
        {isAdmin && <OmprengAddButton />}
      </PageHeader>

      <KpiStrip items={kpis} cols={4} />

      {MONTHS.map((m) => {
        const mt = monthTotals.find((t) => t.month === m.value)!;
        const rows: OmprengMonthRow[] = DAPUR_LOCATIONS.map((dapur) => ({
          dapur,
          doc: lookup.get(`${dapur}::${m.value}`),
        }));

        const baseColumns: DataTableColumn<OmprengMonthRow>[] = [
          {
            key: "dapur",
            header: "Dapur",
            nowrap: false,
            cell: (r) => (
              <span className={r.doc ? "font-medium" : "font-medium text-muted-foreground"}>
                {DAPUR_LABELS[r.dapur]}
              </span>
            ),
          },
          {
            key: "ompreng",
            header: "Ompreng",
            align: "right",
            cell: (r) => (r.doc ? r.doc.jumlah_ompreng.toLocaleString("id-ID") : "—"),
          },
          {
            key: "sasaran",
            header: "Sasaran",
            align: "right",
            cell: (r) => (r.doc ? r.doc.jumlah_sasaran.toLocaleString("id-ID") : "—"),
          },
          {
            key: "kekurangan",
            header: "Kekurangan",
            align: "right",
            cell: (r) =>
              r.doc?.kekurangan_ompreng ? (
                <span className="font-semibold text-warning">
                  {r.doc.kekurangan_ompreng.toLocaleString("id-ID")}
                </span>
              ) : (
                "—"
              ),
          },
          {
            key: "alasan",
            header: "Alasan tambah",
            nowrap: false,
            className: "max-w-[220px]",
            cell: (r) => (
              <span className="text-xs text-muted-foreground line-clamp-2">
                {r.doc?.alasan_tambah || "—"}
              </span>
            ),
          },
        ];

        const columns: DataTableColumn<OmprengMonthRow>[] = isAdmin
          ? [
              ...baseColumns,
              {
                key: "actions",
                header: "\u00a0",
                align: "right",
                headerClassName: "w-14",
                className: "w-14",
                cell: (r) => (r.doc ? <OmprengRowActions row={r.doc} /> : null),
              },
            ]
          : baseColumns;

        return (
          <SectionCard
            key={m.value}
            icon={UtensilsCrossed}
            title={m.labelLong}
            tone="info"
            bodyClassName="px-0 md:px-4"
            badge={
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span>
                  Ompreng: <strong className="text-foreground">{mt.total_ompreng.toLocaleString("id-ID")}</strong>
                </span>
                <span>
                  Sasaran: <strong className="text-foreground">{mt.total_sasaran.toLocaleString("id-ID")}</strong>
                </span>
                {mt.total_kekurangan > 0 && (
                  <span>
                    Kurang: <strong className="text-warning">{mt.total_kekurangan.toLocaleString("id-ID")}</strong>
                  </span>
                )}
              </div>
            }
          >
            <DataTable<OmprengMonthRow>
              bleedMobile={false}
              compact
              minWidth={720}
              rows={rows}
              rowKey={(r) => `${m.value}-${r.dapur}`}
              getRowClassName={(r) => (!r.doc ? "opacity-40" : undefined)}
              columns={columns}
              footer={
                <TableRow className="hover:bg-transparent border-t border-border font-bold">
                  <TableCell className="py-2">Total</TableCell>
                  <TableCell className="py-2 text-right tabular-nums">
                    {mt.total_ompreng.toLocaleString("id-ID")}
                  </TableCell>
                  <TableCell className="py-2 text-right tabular-nums">
                    {mt.total_sasaran.toLocaleString("id-ID")}
                  </TableCell>
                  <TableCell className="py-2 text-right tabular-nums text-warning">
                    {mt.total_kekurangan > 0 ? mt.total_kekurangan.toLocaleString("id-ID") : "—"}
                  </TableCell>
                  <TableCell colSpan={isAdmin ? 2 : 1} className="py-2" />
                </TableRow>
              }
            />
          </SectionCard>
        );
      })}
    </DashboardPageShell>
  );
}
