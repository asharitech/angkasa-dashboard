import Link from "next/link";
import { getObligations, getAccounts } from "@/lib/data";
import { getSession } from "@/lib/auth";
import { formatRupiah, formatDateShort } from "@/lib/format";
import { formatRequestorName, formatFundSource, formatStatusLabel } from "@/lib/names";
import { PageHeader } from "@/components/page-header";
import { SectionCard } from "@/components/section-card";
import { KpiStrip, type KpiItem } from "@/components/kpi-strip";
import { EmptyState } from "@/components/empty-state";
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

function monthLabel(month: string) {
  if (month === "2026-04") return "April 2026";
  if (month === "2026-03") return "Maret 2026";
  return month;
}

function groupByRequestor(items: Obligation[]) {
  return Object.entries(
    items
      .sort((a, b) => {
        const ad = new Date(a.created_at || 0).getTime();
        const bd = new Date(b.created_at || 0).getTime();
        return bd - ad;
      })
      .reduce<Record<string, Obligation[]>>((acc, item) => {
        const key = formatRequestorName(item.requestor);
        if (!acc[key]) acc[key] = [];
        acc[key].push(item);
        return acc;
      }, {}),
  ).sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]));
}

function itemDate(o: Obligation) {
  if (o.status === "lunas" && o.resolved_at) return formatDateShort(o.resolved_at);
  if (o.date_spent) return formatDateShort(o.date_spent);
  return formatDateShort(o.created_at);
}

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
          </div>
        </div>
      </summary>

      <div className="mt-3 space-y-3 pl-8 text-sm">
        {o.detail && o.detail.length > 0 ? (
          <div>
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Rincian
            </p>
            <ul className="space-y-1">
              {o.detail.map((d, i) => (
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
  return (
    <section>
      <div className="flex items-baseline justify-between gap-3 pb-2">
        <h3 className="text-base font-semibold tracking-tight text-foreground">{requestorName}</h3>
        <p className="text-xs text-muted-foreground tabular-nums">
          {items.length} item · {formatRupiah(total)}
        </p>
      </div>
      <div className="divide-y divide-border/60 border-y border-border/60">
        {items.map((o, index) => (
          <PengajuanRow
            key={o._id}
            o={o}
            index={index}
            isAdmin={isAdmin}
            yayasanAccounts={yayasanAccounts}
          />
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
  const monthView = params.monthView ?? params.period ?? "2026-04";
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

  const months = [
    { key: "2026-04", label: "April 2026" },
    { key: "2026-03", label: "Maret 2026" },
  ];

  const statuses = [
    {
      key: "pending",
      label: "pending",
      count: pendingItems.length,
      active: "bg-amber-100 text-amber-900 ring-amber-200",
      idle: "text-muted-foreground hover:bg-amber-50 hover:text-amber-800",
    },
    {
      key: "lunas",
      label: "lunas",
      count: lunasItems.length,
      active: "bg-emerald-100 text-emerald-900 ring-emerald-200",
      idle: "text-muted-foreground hover:bg-emerald-50 hover:text-emerald-800",
    },
  ] as const;

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

      <div className="space-y-2.5">
        <div className="flex flex-wrap gap-2">
          {months.map((m) => (
            <Link
              key={m.key}
              href={buildHref(m.key)}
              className={cn(
                "rounded-full px-4 py-1.5 text-sm font-semibold transition-colors",
                monthView === m.key
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              {m.label}
            </Link>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          {statuses.map((s) => {
            const isActive = statusView === s.key;
            return (
              <Link
                key={s.key}
                href={buildHref(monthView, s.key)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset transition-colors",
                  isActive ? s.active : cn("ring-border/60", s.idle),
                )}
              >
                <span>{s.label}</span>
                {s.count > 0 ? (
                  <span className="tabular-nums opacity-80">({s.count})</span>
                ) : null}
              </Link>
            );
          })}
        </div>
      </div>

      <SectionCard
        icon={Receipt}
        title={`Pengajuan ${monthLabel(monthView)}`}
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
            description={`Belum ada pengajuan ${statusView} pada ${monthLabel(monthView)}.`}
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
