import { getObligations, getAccounts } from "@/lib/data";
import { getSession } from "@/lib/auth";
import { formatRupiah, formatDateShort } from "@/lib/format";
import { monthLabel, recentMonths, currentWitaMonth } from "@/lib/periods";
import { formatRequestorName, formatFundSource, formatStatusLabel } from "@/lib/names";
import { PageHeader } from "@/components/page-header";
import { SectionCard } from "@/components/section-card";
import { KpiStrip, type KpiItem } from "@/components/kpi-strip";
import { EmptyState } from "@/components/empty-state";
import { FilterBar, FilterTabs, type FilterTab } from "@/components/filter-bar";
import { PengajuanCreateButton, PengajuanRowActions } from "@/components/pengajuan-row-actions";
import { BuktiButton } from "@/components/bukti-button";
import { Badge } from "@/components/ui/badge";
import { obligationStatusTone, toneBadge } from "@/lib/colors";
import { cn } from "@/lib/utils";
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
  if (o.status === "lunas" && o.resolved_at) return formatDateShort(o.resolved_at);
  if (o.date_spent) return formatDateShort(o.date_spent);
  return formatDateShort(o.created_at);
}

const PREVIEW_LIMIT = 3;

function PengajuanRow({
  o,
  index,
  isAdmin,
  yayasanAccounts,
}: {
  o: Obligation;
  index: number;
  isAdmin: boolean;
  yayasanAccounts: Account[];
}) {
  const details = o.detail ?? [];
  const hasDetails = details.length > 0;
  const preview = details.slice(0, PREVIEW_LIMIT);
  const remainder = details.length - preview.length;

  return (
    <details className="group py-3 [&_summary::-webkit-details-marker]:hidden">
      <summary className="cursor-pointer list-none">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 w-5 shrink-0 text-sm font-medium text-muted-foreground tabular-nums">
            {index + 1}.
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <p className="min-w-0 text-[15px] font-semibold leading-snug text-foreground">
                {o.item}
              </p>
              <p className="shrink-0 text-[15px] font-semibold tabular-nums text-foreground">
                {o.amount ? formatRupiah(o.amount) : "—"}
              </p>
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
              <Badge className={cn("h-5 px-2 font-medium", toneBadge[obligationStatusTone(o.status)])}>
                {formatStatusLabel(o.status)}
              </Badge>
              {o.category ? (
                <span className="rounded-md bg-muted/60 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                  {o.category.replace(/_/g, " ")}
                </span>
              ) : null}
              <span>{formatFundSource(o.sumber_dana) || "—"}</span>
              <span aria-hidden>·</span>
              <span>{itemDate(o)}</span>
            </div>
            {hasDetails && (
              <ul className="mt-2 space-y-0.5 text-xs text-muted-foreground group-open:hidden">
                {preview.map((d, i) => (
                  <li key={`${o._id}-pv-${i}`} className="flex items-start gap-2">
                    <span className="text-muted-foreground/60">•</span>
                    <span className="min-w-0 flex-1 truncate">{d.item}</span>
                    <span className="shrink-0 tabular-nums">{formatRupiah(d.amount)}</span>
                  </li>
                ))}
                {remainder > 0 && (
                  <li className="text-[11px] italic text-muted-foreground/70">
                    +{remainder} item lainnya — klik untuk lihat semua
                  </li>
                )}
              </ul>
            )}
          </div>
        </div>
      </summary>

      <div className="mt-3 space-y-3 pl-8 text-sm">
        {hasDetails ? (
          <div>
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Rincian
            </p>
            <ul className="space-y-1">
              {details.map((d, i) => (
                <li
                  key={`${o._id}-${i}`}
                  className="flex items-start justify-between gap-3 text-sm"
                >
                  <span className="min-w-0 text-muted-foreground">
                    <span className="mr-2 tabular-nums">{i + 1}.</span>
                    {d.item}
                  </span>
                  <span className="shrink-0 font-medium tabular-nums">
                    {formatRupiah(d.amount)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span>Dibuat {formatDateShort(o.created_at)}</span>
            {o.resolved_at ? <span>• Selesai {formatDateShort(o.resolved_at)}</span> : null}
          </div>
          {isAdmin ? (
            <div className="flex items-center gap-1">
              <BuktiButton
                obligationId={o._id}
                buktiUrl={o.bukti_url}
                buktiType={o.bukti_type}
                itemLabel={o.item}
              />
              <PengajuanRowActions obligation={o} accounts={yayasanAccounts} />
            </div>
          ) : null}
        </div>
      </div>
    </details>
  );
}

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
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
              {cat.replace(/_/g, ' ')}
            </p>
            <div className="divide-y divide-border/60 border-y border-border/60">
              {rows.map(({ o, globalIdx }) => (
                <PengajuanRow
                  key={o._id}
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
    const qs = new URLSearchParams();
    qs.set("monthView", nextMonth);
    qs.set("period", nextMonth);
    qs.set("statusView", nextStatus);
    return `/pengajuan?${qs.toString()}`;
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
