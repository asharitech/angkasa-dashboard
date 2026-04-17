import Link from "next/link";
import { getObligations, validateObligationData } from "@/lib/data";
import { formatRupiah, formatDateShort } from "@/lib/format";
import { formatRequestorName, formatFundSource, formatStatusLabel } from "@/lib/names";
import { PageHeader } from "@/components/page-header";
import { PeriodPicker } from "@/components/period-picker";
import { FilterTabs, type FilterTab } from "@/components/filter-bar";
import { SectionCard } from "@/components/section-card";
import { KpiStrip, type KpiItem } from "@/components/kpi-strip";
import { EmptyState } from "@/components/empty-state";
import { DataTable, type Column } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { obligationStatusTone, toneBadge } from "@/lib/colors";
import { cn } from "@/lib/utils";
import {
  Receipt,
  AlertTriangle,
  Search,
  Inbox,
  ListChecks,
  Wallet,
  Users,
} from "lucide-react";
import type { Obligation } from "@/lib/types";

export const dynamic = "force-dynamic";

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "lunas", label: "Selesai" },
  { value: "all", label: "Semua" },
];

type SP = {
  status?: string;
  requestor?: string;
  q?: string;
  period?: string;
};

export default async function PengajuanPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const params = await searchParams;
  const status = params.status ?? "pending";
  const requestor = params.requestor ?? "all";
  const q = params.q?.trim() ?? "";
  const period = params.period;

  const baseFilter: Record<string, unknown> = { type: "pengajuan" };
  if (period) baseFilter.month = period;

  const [allInScope, qualityReport] = await Promise.all([
    getObligations(baseFilter),
    validateObligationData(period ? { month: period } : {}),
  ]);

  const requestors = Array.from(
    new Set(allInScope.map((o) => o.requestor).filter(Boolean)),
  ) as string[];
  requestors.sort();

  const filtered = allInScope.filter((o) => {
    if (status !== "all" && o.status !== status) return false;
    if (requestor !== "all" && o.requestor !== requestor) return false;
    if (q) {
      const t = q.toLowerCase();
      const hit =
        o.item?.toLowerCase().includes(t) ||
        o.requestor?.toLowerCase().includes(t) ||
        o.category?.toLowerCase().includes(t) ||
        o.sumber_dana?.toLowerCase().includes(t);
      if (!hit) return false;
    }
    return true;
  });

  const counts = {
    pending: allInScope.filter((o) => o.status === "pending").length,
    lunas: allInScope.filter((o) => o.status === "lunas").length,
    all: allInScope.length,
  };

  const pending = allInScope.filter((o) => o.status === "pending");
  const pendingTotal = pending.reduce((s, o) => s + (o.amount ?? 0), 0);
  const filteredTotal = filtered.reduce((s, o) => s + (o.amount ?? 0), 0);

  function buildHref(next: Partial<SP>) {
    const qs = new URLSearchParams();
    const s = next.status ?? status;
    const r = next.requestor ?? requestor;
    const query = next.q ?? q;
    const p = next.period ?? period;
    if (s !== "pending") qs.set("status", s);
    if (r !== "all") qs.set("requestor", r);
    if (query) qs.set("q", query);
    if (p) qs.set("period", p);
    const out = qs.toString();
    return out ? `/pengajuan?${out}` : "/pengajuan";
  }

  const periodExtra: Record<string, string> = {};
  if (status !== "pending") periodExtra.status = status;
  if (requestor !== "all") periodExtra.requestor = requestor;
  if (q) periodExtra.q = q;

  const statusTabs: FilterTab[] = STATUS_OPTIONS.map((o) => ({
    label: o.label,
    href: buildHref({ status: o.value, requestor: "all" }),
    active: o.value === status,
    count: counts[o.value as keyof typeof counts],
  }));

  const kpis: KpiItem[] = [
    {
      label: "Pending",
      value: String(counts.pending),
      icon: ListChecks,
      tone: "warning",
      hint: formatRupiah(pendingTotal),
    },
    {
      label: "Selesai",
      value: String(counts.lunas),
      icon: Receipt,
      tone: "success",
    },
    {
      label: "Requestor",
      value: String(requestors.length),
      icon: Users,
      tone: "info",
    },
    {
      label: "Total Scope",
      value: formatRupiah(allInScope.reduce((s, o) => s + (o.amount ?? 0), 0)),
      icon: Wallet,
      tone: "primary",
    },
  ];

  const columns: Column<Obligation>[] = [
    {
      key: "item",
      header: "Item",
      cell: (o) => (
        <div className="min-w-0">
          <p className="truncate font-medium">{o.item}</p>
          {o.category && (
            <p className="mt-0.5 text-xs text-muted-foreground">
              {o.category.replace(/_/g, " ")}
            </p>
          )}
        </div>
      ),
    },
    {
      key: "requestor",
      header: "Requestor",
      cell: (o) => (
        <span className="text-sm">{formatRequestorName(o.requestor)}</span>
      ),
    },
    {
      key: "date",
      header: "Tanggal",
      cell: (o) => (
        <span className="text-xs text-muted-foreground">
          {o.date_spent ? formatDateShort(o.date_spent) : "—"}
        </span>
      ),
    },
    {
      key: "source",
      header: "Sumber",
      cell: (o) => (
        <span className="text-xs text-muted-foreground">
          {formatFundSource(o.sumber_dana) || "—"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      align: "center",
      cell: (o) => (
        <Badge className={cn("text-xs", toneBadge[obligationStatusTone(o.status)])}>
          {formatStatusLabel(o.status)}
        </Badge>
      ),
    },
    {
      key: "amount",
      header: "Jumlah",
      align: "right",
      cell: (o) => (
        <span className="font-semibold">
          {o.amount ? formatRupiah(o.amount) : "—"}
        </span>
      ),
    },
  ];

  const hasQualityIssues =
    qualityReport.duplicateCount > 0 || qualityReport.missingFieldCount > 0;

  return (
    <div className="space-y-5">
      <PageHeader icon={Receipt} title="Pengajuan">
        <div className="flex flex-wrap items-center gap-2">
          <Badge className={cn("font-semibold", toneBadge.warning)}>
            {pending.length} pending · {formatRupiah(pendingTotal)}
          </Badge>
        </div>
      </PageHeader>

      <KpiStrip items={kpis} cols={4} />

      <PeriodPicker basePath="/pengajuan" current={period} extraParams={periodExtra} />

      {hasQualityIssues && (
        <SectionCard
          icon={AlertTriangle}
          tone="warning"
          title="Isu Kualitas Data"
          badge={
            <Badge variant="outline" className="ml-1 text-xs">
              {qualityReport.duplicateCount + qualityReport.missingFieldCount}
            </Badge>
          }
          action={
            <Link
              href="/audit"
              className="text-xs font-medium text-primary hover:underline"
            >
              Lihat audit →
            </Link>
          }
        >
          <ul className="space-y-1 text-xs text-amber-700">
            {qualityReport.duplicateCount > 0 && (
              <li>· {qualityReport.duplicateCount} duplikasi terdeteksi</li>
            )}
            {qualityReport.missingFieldCount > 0 && (
              <li>· {qualityReport.missingFieldCount} field tidak lengkap</li>
            )}
          </ul>
        </SectionCard>
      )}

      <FilterTabs tabs={statusTabs} />

      <form
        action="/pengajuan"
        method="get"
        className="flex flex-col gap-2 sm:flex-row sm:items-center"
      >
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            name="q"
            defaultValue={q}
            placeholder="Cari item, requestor, kategori, sumber dana…"
            className="pl-9"
          />
        </div>
        {status !== "pending" && <input type="hidden" name="status" value={status} />}
        {requestor !== "all" && (
          <input type="hidden" name="requestor" value={requestor} />
        )}
        {period && <input type="hidden" name="period" value={period} />}
        <div className="flex gap-2">
          <button
            type="submit"
            className="rounded-md bg-foreground px-3 py-2 text-xs font-semibold text-background hover:opacity-90"
          >
            Cari
          </button>
          {q && (
            <Link
              href={buildHref({ q: "" })}
              className="rounded-md border border-border px-3 py-2 text-xs font-medium hover:bg-accent"
            >
              Reset
            </Link>
          )}
        </div>
      </form>

      {requestors.length > 0 && (
        <div className="space-y-1.5">
          <p className="px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Requestor
          </p>
          <div className="flex flex-wrap gap-1.5">
            <Link
              href={buildHref({ requestor: "all" })}
              className={cn(
                "shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                requestor === "all"
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-background text-muted-foreground hover:text-foreground",
              )}
            >
              Semua
            </Link>
            {requestors.map((r) => {
              const active = r === requestor;
              return (
                <Link
                  key={r}
                  href={buildHref({ requestor: r })}
                  className={cn(
                    "shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                    active
                      ? "border-foreground bg-foreground text-background"
                      : "border-border bg-background text-muted-foreground hover:text-foreground",
                  )}
                >
                  {formatRequestorName(r)}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      <SectionCard
        icon={Receipt}
        title={`${filtered.length} ${filtered.length === 1 ? "submission" : "submissions"}`}
        badge={
          <span className="ml-1 text-xs text-muted-foreground tabular-nums">
            {formatRupiah(filteredTotal)}
          </span>
        }
        bodyClassName="p-0"
      >
        {filtered.length === 0 ? (
          <div className="p-4">
            <EmptyState
              icon={Inbox}
              title="Tidak ada pengajuan"
              description={
                q || requestor !== "all" || status !== "pending"
                  ? "Coba ubah filter atau hapus pencarian."
                  : "Belum ada pengajuan pada periode ini."
              }
              action={
                q || requestor !== "all" || status !== "pending"
                  ? { label: "Reset filter", href: "/pengajuan" }
                  : undefined
              }
            />
          </div>
        ) : (
          <DataTable
            columns={columns}
            rows={filtered}
            rowKey={(o) => o._id}
            minWidth={720}
          />
        )}
      </SectionCard>
    </div>
  );
}
