import { getObligations, getAccounts } from "@/lib/data";
import { getSession } from "@/lib/auth";
import { formatRupiah } from "@/lib/format";
import { monthLabel, recentMonths, currentWitaMonth } from "@/lib/periods";
import { buildDashboardHref } from "@/lib/dashboard-query";
import { formatRequestorName } from "@/lib/names";
import { PageHeader } from "@/components/page-header";
import { SectionCard } from "@/components/section-card";
import { KpiStrip, type KpiItem } from "@/components/kpi-strip";
import { EmptyState } from "@/components/empty-state";
import { FilterBar, FilterTabs, type FilterTab } from "@/components/filter-bar";
import { PengajuanCreateButton } from "@/components/pengajuan-row-actions";
import { PengajuanAccordionRow } from "@/components/pengajuan-accordion";
import { Badge } from "@/components/ui/badge";
import { toneBadge } from "@/lib/colors";
import { cn, idString } from "@/lib/utils";
import { ListSectionTitle } from "@/components/list-section-title";
import { Receipt, Inbox, ListChecks, Wallet, Users } from "lucide-react";
import type { Obligation, Account } from "@/lib/types";

export const dynamic = "force-dynamic";

type SP = {
  period?: string;
  monthView?: string;
  statusView?: string;
};

function groupByRequestor(items: Obligation[]) {
  const grouped = items.reduce<Record<string, Obligation[]>>((acc, item) => {
    const key = formatRequestorName(item.requestor);
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  for (const key of Object.keys(grouped)) {
    grouped[key].sort((a, b) => {
      const ac = a.category ?? "";
      const bc = b.category ?? "";
      if (ac !== bc) {
        if (!ac) return 1;
        if (!bc) return -1;
        return ac.localeCompare(bc);
      }
      const ad = new Date(a.created_at || 0).getTime();
      const bd = new Date(b.created_at || 0).getTime();
      return bd - ad;
    });
  }

  return Object.entries(grouped).sort(
    (a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]),
  );
}

function itemDate(o: Obligation) {
  if (o.status === "lunas" && o.resolved_at) return o.resolved_at;
  if (o.date_spent) return o.date_spent;
  return o.created_at;
}

// PengajuanRow replaced by PengajuanAccordionRow (client component with animation)

function RequestorGroup({
  requestorName,
  items,
  isAdmin,
  yayasanAccounts,
}: {
  requestorName: string;
  items: Obligation[];
  isAdmin: boolean;
  yayasanAccounts: Account[];
}) {
  const total = items.reduce((s, o) => s + (o.amount ?? 0), 0);

  // group per category, preserve order from groupByRequestor sort
  const categoryGroups: { cat: string; rows: { o: Obligation; globalIdx: number }[] }[] = [];
  let globalIndex = 0;
  for (const o of items) {
    const cat = o.category || 'lainnya';
    let group = categoryGroups.find((g) => g.cat === cat);
    if (!group) {
      group = { cat, rows: [] };
      categoryGroups.push(group);
    }
    group.rows.push({ o, globalIdx: globalIndex });
    globalIndex++;
  }

  return (
    <section>
      <div className="flex items-baseline justify-between gap-3 pb-2">
        <h3 className="text-base font-semibold tracking-tight text-foreground">{requestorName}</h3>
        <p className="text-xs text-muted-foreground tabular-nums">
          {items.length} item · {formatRupiah(total)}
        </p>
      </div>

      <div className="space-y-4">
        {categoryGroups.map(({ cat, rows }) => (
          <div key={`${requestorName}-${cat}`}>
            <ListSectionTitle>{cat.replace(/_/g, " ")}</ListSectionTitle>
            <div className="divide-y divide-border/60 border-y border-border/60">
              {rows.map(({ o, globalIdx }) => (
                <PengajuanAccordionRow
                  key={idString(o._id)}
                  o={o}
                  index={globalIdx}
                  isAdmin={isAdmin}
                  yayasanAccounts={yayasanAccounts}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default async function PengajuanPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const params = await searchParams;
  const monthView = params.monthView ?? params.period ?? currentWitaMonth();
  const statusView = params.statusView ?? "pending";

  const [allInScope, session, accounts] = await Promise.all([
    getObligations({ type: "pengajuan", month: monthView }),
    getSession(),
    getAccounts(),
  ]);

  const isAdmin = session?.role === "admin";
  const yayasanAccounts = accounts.filter((a) => a.type === "yayasan");

  const pendingItems = allInScope.filter((o) => o.status === "pending");
  const lunasItems = allInScope.filter((o) => o.status === "lunas");
  const activeItems = statusView === "lunas" ? lunasItems : pendingItems;
  const totalScope = allInScope.reduce((s, o) => s + (o.amount ?? 0), 0);
  const activeTotal = activeItems.reduce((s, o) => s + (o.amount ?? 0), 0);

  const groupedActive = groupByRequestor(activeItems);

  const kpis: KpiItem[] = [
    {
      label: "Pending",
      value: String(pendingItems.length),
      icon: ListChecks,
      tone: "warning",
      hint: formatRupiah(pendingItems.reduce((s, o) => s + (o.amount ?? 0), 0)),
    },
    {
      label: "Selesai",
      value: String(lunasItems.length),
      icon: Receipt,
      tone: "success",
      hint: formatRupiah(lunasItems.reduce((s, o) => s + (o.amount ?? 0), 0)),
    },
    {
      label: "Requestor",
      value: String(groupByRequestor(allInScope).length),
      icon: Users,
      tone: "info",
    },
    {
      label: "Total Scope",
      value: formatRupiah(totalScope),
      icon: Wallet,
      tone: "primary",
    },
  ];

  function buildHref(nextMonth: string, nextStatus = statusView) {
    return buildDashboardHref("/pengajuan", {
      monthView: nextMonth,
      period: nextMonth,
      statusView: nextStatus,
    });
  }

  const monthChoices = recentMonths(4);
  if (!monthChoices.includes(monthView)) monthChoices.push(monthView);
  monthChoices.sort().reverse();
  const monthTabs: FilterTab[] = monthChoices.map((m) => ({
    label: monthLabel(m, "long"),
    href: buildHref(m),
    active: monthView === m,
  }));

  const statusTabs: FilterTab[] = [
    {
      label: "Pending",
      href: buildHref(monthView, "pending"),
      active: statusView === "pending",
      count: pendingItems.length,
    },
    {
      label: "Lunas",
      href: buildHref(monthView, "lunas"),
      active: statusView === "lunas",
      count: lunasItems.length,
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader icon={Receipt} title="Pengajuan">
        <div className="flex flex-wrap items-center gap-2">
          <Badge className={cn("font-semibold", toneBadge.warning)}>
            {pendingItems.length} pending · {formatRupiah(pendingItems.reduce((s, o) => s + (o.amount ?? 0), 0))}
          </Badge>
          {isAdmin && <PengajuanCreateButton />}
        </div>
      </PageHeader>

      <KpiStrip items={kpis} cols={4} />

      <FilterBar>
        <FilterTabs tabs={monthTabs} />
        <FilterTabs tabs={statusTabs} size="sm" />
      </FilterBar>

      <SectionCard
        icon={Receipt}
        title={`Pengajuan ${monthLabel(monthView, "long")}`}
        badge={
          <span className="ml-1 text-xs text-muted-foreground tabular-nums">
            {formatRupiah(activeTotal)}
          </span>
        }
      >
        {groupedActive.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title={`Tidak ada ${statusView}`}
            description={`Belum ada pengajuan ${statusView} pada ${monthLabel(monthView, "long")}.`}
            action={isAdmin && statusView === "pending" ? <PengajuanCreateButton /> : undefined}
          />
        ) : (
          <div className="space-y-7">
            {groupedActive.map(([requestorName, items]) => (
              <RequestorGroup
                key={`${statusView}-${requestorName}`}
                requestorName={requestorName}
                items={items}
                isAdmin={isAdmin}
                yayasanAccounts={yayasanAccounts}
              />
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
