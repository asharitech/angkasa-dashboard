import { getActivityFeed, getAccounts } from "@/lib/data";
import { getSession } from "@/lib/auth";
import { formatRupiah, formatRelativeTime, formatDateShort } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { PeriodPicker } from "@/components/period-picker";
import { FilterBar, FilterTabs, type FilterTab } from "@/components/filter-bar";
import { SectionCard } from "@/components/section-card";
import { EmptyState } from "@/components/empty-state";
import {
  EntryCreateButton,
  EntryRowActions,
} from "@/components/entry-row-actions";
import { Badge } from "@/components/ui/badge";
import { obligationStatusTone, toneBadge } from "@/lib/colors";
import { formatStatusLabel } from "@/lib/names";
import { cn } from "@/lib/utils";
import {
  Activity,
  ArrowDownLeft,
  ArrowUpRight,
  Receipt,
  CreditCard,
  Repeat,
  Inbox,
} from "lucide-react";

export const dynamic = "force-dynamic";

const TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "Semua" },
  { value: "entry", label: "Transaksi" },
  { value: "obligation", label: "Pengajuan" },
];

const DOMAIN_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "Semua Domain" },
  { value: "yayasan", label: "Yayasan" },
  { value: "personal", label: "Pribadi" },
];

function EventIcon({ event }: { event: { type: string; direction?: string; domain?: string } }) {
  if (event.type === "entry") {
    return event.direction === "in" ? (
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
        <ArrowDownLeft className="h-4 w-4" />
      </span>
    ) : (
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-50 text-rose-600">
        <ArrowUpRight className="h-4 w-4" />
      </span>
    );
  }
  const iconMap: Record<string, { icon: typeof Receipt; bg: string; color: string }> = {
    pengajuan: { icon: Receipt, bg: "bg-amber-50", color: "text-amber-600" },
    loan: { icon: CreditCard, bg: "bg-violet-50", color: "text-violet-600" },
    recurring: { icon: Repeat, bg: "bg-blue-50", color: "text-blue-600" },
  };
  const cfg = iconMap[event.domain ?? ""] ?? iconMap.pengajuan;
  const Icon = cfg.icon;
  return (
    <span className={cn("flex h-8 w-8 items-center justify-center rounded-full", cfg.bg, cfg.color)}>
      <Icon className="h-4 w-4" />
    </span>
  );
}

export default async function AktivitasPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; domain?: string; period?: string }>;
}) {
  const params = await searchParams;
  const typeFilter = params.type ?? "all";
  const domainFilter = params.domain ?? "all";
  const period = params.period;

  const [allEvents, session, accounts] = await Promise.all([
    getActivityFeed(50, {
      ...(domainFilter !== "all" ? { domain: domainFilter } : {}),
      ...(period ? { period } : {}),
    }),
    getSession(),
    getAccounts(),
  ]);
  const isAdmin = session?.role === "admin";
  const events =
    typeFilter === "all"
      ? allEvents
      : allEvents.filter((e) =>
          typeFilter === "entry" ? e.type === "entry" : e.type === "obligation",
        );

  function buildHref(next: { type?: string; domain?: string }) {
    const qs = new URLSearchParams();
    const t = next.type ?? typeFilter;
    const d = next.domain ?? domainFilter;
    if (t !== "all") qs.set("type", t);
    if (d !== "all") qs.set("domain", d);
    if (period) qs.set("period", period);
    const s = qs.toString();
    return s ? `/aktivitas?${s}` : "/aktivitas";
  }

  const periodExtra: Record<string, string> = {};
  if (typeFilter !== "all") periodExtra.type = typeFilter;
  if (domainFilter !== "all") periodExtra.domain = domainFilter;

  const typeTabs: FilterTab[] = TYPE_OPTIONS.map((o) => ({
    label: o.label,
    href: buildHref({ type: o.value }),
    active: o.value === typeFilter,
  }));
  const domainTabs: FilterTab[] = DOMAIN_OPTIONS.map((o) => ({
    label: o.label,
    href: buildHref({ domain: o.value }),
    active: o.value === domainFilter,
  }));

  const grouped = new Map<string, typeof events>();
  for (const event of events) {
    const day = new Date(event.date).toISOString().slice(0, 10);
    if (!grouped.has(day)) grouped.set(day, []);
    grouped.get(day)!.push(event);
  }

  return (
    <div className="space-y-5">
      <PageHeader icon={Activity} title="Aktivitas">
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground tabular-nums">{events.length} event</span>
          {isAdmin && <EntryCreateButton accounts={accounts} />}
        </div>
      </PageHeader>

      <FilterBar>
        <PeriodPicker basePath="/aktivitas" current={period} extraParams={periodExtra} />
        <FilterTabs tabs={typeTabs} size="sm" />
        <FilterTabs tabs={domainTabs} size="sm" />
      </FilterBar>

      {events.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="Belum ada aktivitas"
          description="Tidak ada event sesuai filter yang dipilih."
        />
      ) : (
        Array.from(grouped.entries()).map(([day, dayEvents]) => (
          <section key={day} className="space-y-2">
            <p className="px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {formatDateShort(day)}
            </p>
            <SectionCard bodyClassName="p-0">
              <ul className="divide-y divide-border/50">
                {dayEvents.map((event) => {
                  const tone = event.status ? obligationStatusTone(event.status) : "neutral";
                  return (
                    <li key={event._id} className="flex items-start gap-3 px-4 py-3">
                      <div className="mt-0.5">
                        <EventIcon event={event} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{event.title}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{event.subtitle}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        {event.amount != null && event.amount > 0 && (
                          <p
                            className={cn(
                              "text-sm font-semibold tabular-nums",
                              event.direction === "in"
                                ? "text-emerald-600"
                                : event.direction === "out"
                                  ? "text-rose-600"
                                  : "",
                            )}
                          >
                            {event.direction === "in" ? "+" : event.direction === "out" ? "−" : ""}
                            {formatRupiah(event.amount)}
                          </p>
                        )}
                        {event.status && (
                          <Badge className={cn("mt-0.5 text-xs", toneBadge[tone])}>
                            {formatStatusLabel(event.status)}
                          </Badge>
                        )}
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {formatRelativeTime(event.date)}
                        </p>
                      </div>
                      {isAdmin && event.type === "entry" && (
                        <EntryRowActions entryId={event._id} accounts={accounts} />
                      )}
                    </li>
                  );
                })}
              </ul>
            </SectionCard>
          </section>
        ))
      )}
    </div>
  );
}
