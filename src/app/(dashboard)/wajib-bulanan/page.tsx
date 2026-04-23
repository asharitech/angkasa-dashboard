import { getWajibBulanan, getAccounts } from "@/lib/data";
import { monthLabel, recentMonths, currentWitaMonth } from "@/lib/periods";
import { buildDashboardHref } from "@/lib/dashboard-query";
import { getSession } from "@/lib/auth";
import { formatRupiah } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { SectionCard } from "@/components/section-card";
import { KpiStrip, type KpiItem } from "@/components/kpi-strip";
import { EmptyState } from "@/components/empty-state";
import { WajibBulananRow } from "@/components/wajib-bulanan-row";
import { WajibBulananCreateButton } from "@/components/wajib-bulanan-actions";
import { Badge } from "@/components/ui/badge";
import { toneBadge } from "@/lib/colors";
import { MeterBarLabeled } from "@/components/meter-bar";
import { cn } from "@/lib/utils";
import { CalendarDays, CheckCircle2, Clock, Wallet, ListChecks, AlertCircle, RotateCcw } from "lucide-react";
import { FilterBar, FilterTabs, type FilterTab } from "@/components/filter-bar";
import type { Obligation } from "@/lib/types";

export const dynamic = "force-dynamic";

interface SearchParams {
  statusView?: string;
  month?: string;
}

function groupByCategory(items: Obligation[]) {
  const grouped = items.reduce<Record<string, Obligation[]>>((acc, item) => {
    const key = item.category || "Lainnya";
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  for (const key of Object.keys(grouped)) {
    grouped[key].sort((a, b) => {
      const ad = new Date(a.created_at || 0).getTime();
      const bd = new Date(b.created_at || 0).getTime();
      return bd - ad;
    });
  }

  return Object.entries(grouped).sort(
    (a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]),
  );
}

function CategoryGroup({
  category,
  items,
  isAdmin,
  yayasanAccounts,
}: {
  category: string;
  items: Obligation[];
  isAdmin: boolean;
  yayasanAccounts: { _id: string; bank: string }[];
}) {
  const total = items.reduce((s, o) => s + (o.amount ?? 0), 0);
  const sudahCount = items.filter((i) => i.status === "lunas").length;
  const progress = items.length > 0 ? (sudahCount / items.length) * 100 : 0;
  const semuaLunas = sudahCount === items.length && items.length > 0;

  return (
    <SectionCard
      icon={ListChecks}
      title={category.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
      tone={semuaLunas ? "success" : "warning"}
      badge={
        <span className="ml-1 text-xs tabular-nums">
          {sudahCount}/{items.length} · {formatRupiah(total)}
        </span>
      }
    >
      <div className="mb-4">
        <MeterBarLabeled
          percent={Math.min(Math.round(progress), 100)}
          fillClassName={semuaLunas ? "bg-emerald-500" : "bg-amber-500"}
          labelLeft={<span className="text-muted-foreground">Progress</span>}
          labelRight={
            <span className={cn("font-medium", semuaLunas ? "text-emerald-600" : "text-amber-600")}>
              {Math.round(progress)}%
            </span>
          }
        />
      </div>

      <div className="divide-y divide-border/60 border-y border-border/60">
        {items.map((item, idx) => (
          <WajibBulananRow
            key={item._id}
            item={item}
            index={idx}
            isAdmin={isAdmin}
            yayasanAccounts={yayasanAccounts}
          />
        ))}
      </div>
    </SectionCard>
  );
}

export default async function WajibBulananPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const statusView = params.statusView ?? "all";
  const monthView = params.month ?? currentWitaMonth();
  
  const [allItems, session, accounts] = await Promise.all([
    getWajibBulanan(),
    getSession(),
    getAccounts(),
  ]);
  
  // Filter by month if specified
  const monthFilteredItems = monthView 
    ? allItems.filter((o) => o.month === monthView || !o.month) // Include items without month (recurring)
    : allItems;

  const isAdmin = session?.role === "admin";
  const yayasanAccounts = accounts.filter((a) => a.type === "yayasan");

  // Filter items based on statusView
  const items = statusView === "lunas" 
    ? monthFilteredItems.filter((o) => o.status === "lunas")
    : statusView === "aktif"
    ? monthFilteredItems.filter((o) => o.status === "active" || o.status === "pending")
    : monthFilteredItems;

  const activeItems = allItems.filter((o) => o.status === "active" || o.status === "pending");
  const lunasItems = allItems.filter((o) => o.status === "lunas");
  
  const totalAmount = allItems.reduce((s, o) => s + (o.amount ?? 0), 0);
  const sudahAmount = lunasItems.reduce((s, o) => s + (o.amount ?? 0), 0);
  const sisaAmount = totalAmount - sudahAmount;
  const totalProgress = allItems.length > 0 ? (lunasItems.length / allItems.length) * 100 : 0;

  const groupedItems = groupByCategory(items);
  
  // Month tabs
  const monthChoices = recentMonths(6);
  if (!monthChoices.includes(monthView)) monthChoices.push(monthView);
  monthChoices.sort().reverse();
  
  function buildHref(nextMonth: string, nextStatus = statusView) {
    return buildDashboardHref("/wajib-bulanan", {
      month: nextMonth,
      statusView: nextStatus,
    });
  }
  
  const monthTabs: FilterTab[] = monthChoices.map((m) => ({
    label: monthLabel(m, "short"),
    href: buildHref(m),
    active: monthView === m,
  }));

  const kpis: KpiItem[] = [
    {
      label: "Total / Bulan",
      value: formatRupiah(totalAmount),
      icon: Wallet,
      tone: "primary",
    },
    {
      label: "Sudah Dibayar",
      value: formatRupiah(sudahAmount),
      icon: CheckCircle2,
      tone: "success",
      hint: `${lunasItems.length} item`,
    },
    {
      label: "Sisa",
      value: formatRupiah(sisaAmount),
      icon: Clock,
      tone: sisaAmount > 0 ? "warning" : "success",
      hint: `${activeItems.length} item belum`,
    },
    {
      label: "Progress",
      value: `${Math.round(totalProgress)}%`,
      icon: RotateCcw,
      tone: totalProgress >= 100 ? "success" : "info",
      hint: `${lunasItems.length}/${allItems.length} selesai`,
    },
  ];

  const statusTabs: FilterTab[] = [
    {
      label: "Semua",
      href: buildDashboardHref("/wajib-bulanan", { month: monthView, statusView: "all" }),
      active: statusView === "all",
      count: allItems.length,
    },
    {
      label: "Aktif",
      href: buildDashboardHref("/wajib-bulanan", { month: monthView, statusView: "aktif" }),
      active: statusView === "aktif",
      count: activeItems.length,
    },
    {
      label: "Lunas",
      href: buildDashboardHref("/wajib-bulanan", { month: monthView, statusView: "lunas" }),
      active: statusView === "lunas",
      count: lunasItems.length,
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader icon={CalendarDays} title="Wajib Bulanan Yayasan">
        <div className="flex flex-wrap items-center gap-2">
          <Badge className={cn("font-semibold", sisaAmount > 0 ? toneBadge.warning : toneBadge.success)}>
            {activeItems.length} aktif · {formatRupiah(sisaAmount)}
          </Badge>
          {isAdmin && <WajibBulananCreateButton />}
        </div>
      </PageHeader>

      <KpiStrip items={kpis} cols={4} />

      <FilterBar>
        <FilterTabs tabs={monthTabs} />
        <FilterTabs tabs={statusTabs} size="sm" />
      </FilterBar>
      
      <p className="text-sm text-muted-foreground">
        Menampilkan data untuk <strong>{monthLabel(monthView, "long")}</strong>
      </p>

      {groupedItems.length === 0 ? (
        <EmptyState
          icon={AlertCircle}
          title="Belum ada data"
          description={`Belum ada item ${statusView === "lunas" ? "yang lunas" : statusView === "aktif" ? "yang aktif" : ""} untuk ${monthLabel(monthView, "long")}.`}
          action={isAdmin ? <WajibBulananCreateButton /> : undefined}
        />
      ) : (
        <div className="space-y-4">
          {groupedItems.map(([category, categoryItems]) => (
            <CategoryGroup
              key={category}
              category={category}
              items={categoryItems}
              isAdmin={isAdmin}
              yayasanAccounts={yayasanAccounts}
            />
          ))}
        </div>
      )}
    </div>
  );
}
