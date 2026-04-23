import { getActivityFeed, getAccounts } from "@/lib/data";
import { getSession } from "@/lib/auth";
import { formatRupiah, formatRelativeTime, formatDateShort } from "@/lib/format";

import { PageHeader } from "@/components/page-header";
import { ToneBadge, type Tone } from "@/components/tone-badge";
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
    <main className="content">
      <PageHeader 
        icon={Activity}
        title="Aktivitas"
      >
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-xs)", color: "var(--ink-500)" }}>
          {events.length} event
        </span>
        {isAdmin && <EntryCreateButton accounts={accounts} />}
      </PageHeader>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--sp-4)", marginBottom: "var(--sp-6)" }}>
        <div style={{ display: "flex", gap: "2px", background: "var(--surface)", border: "var(--hair)", borderRadius: "var(--r-sm)", padding: "3px" }}>
          <PeriodPicker basePath="/aktivitas" current={period} extraParams={periodExtra} />
        </div>
        <div style={{ display: "flex", gap: "2px", background: "var(--surface)", border: "var(--hair)", borderRadius: "var(--r-sm)", padding: "3px" }}>
          {typeTabs.map(t => (
            <a key={t.label} href={t.href} style={{ padding: "4px 12px", fontSize: "var(--text-xs)", fontWeight: 500, borderRadius: "3px", textDecoration: "none", color: t.active ? "var(--surface)" : "var(--ink-500)", background: t.active ? "var(--ink-000)" : "transparent" }}>
              {t.label}
            </a>
          ))}
        </div>
        <div style={{ display: "flex", gap: "2px", background: "var(--surface)", border: "var(--hair)", borderRadius: "var(--r-sm)", padding: "3px" }}>
          {domainTabs.map(t => (
            <a key={t.label} href={t.href} style={{ padding: "4px 12px", fontSize: "var(--text-xs)", fontWeight: 500, borderRadius: "3px", textDecoration: "none", color: t.active ? "var(--surface)" : "var(--ink-500)", background: t.active ? "var(--ink-000)" : "transparent" }}>
              {t.label}
            </a>
          ))}
        </div>
      </div>

      {events.length === 0 ? (
        <div style={{ textAlign: "center", padding: "var(--sp-8)", color: "var(--ink-400)" }}>
          <Inbox className="w-8 h-8 mx-auto mb-4" />
          <p>Belum ada aktivitas</p>
        </div>
      ) : (
        Array.from(grouped.entries()).map(([day, dayEvents]) => (
          <section key={day} className="section" style={{ marginBottom: "var(--sp-6)" }}>
            <div className="t-eyebrow" style={{ marginBottom: "var(--sp-3)" }}>
              {formatDateShort(day).toUpperCase()}
            </div>
            <table className="ledger">
              <tbody>
                {dayEvents.map((event) => {
                  const tone = event.status ? obligationStatusTone(event.status) : "neutral";
                  return (
                    <tr key={event._id.toString()}>
                      <td style={{ width: "40px" }}>
                        <EventIcon event={event} />
                      </td>
                      <td style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, color: "var(--ink-000)", marginBottom: "2px" }}>{event.title}</div>
                        <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-400)" }}>{event.subtitle}</div>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        {event.amount != null && event.amount > 0 && (
                          <div className="mono" style={{ 
                            fontWeight: 600, 
                            color: event.direction === "in" ? "var(--pos-700)" : event.direction === "out" ? "var(--neg-700)" : "inherit"
                          }}>
                            {event.direction === "in" ? "+" : event.direction === "out" ? "−" : ""}
                            {formatRupiah(event.amount)}
                          </div>
                        )}
                        {event.status && (
                          <div style={{ marginTop: "4px" }}>
                            <ToneBadge tone={tone === "neutral" ? "outline" : (tone as Tone)}>
                              {formatStatusLabel(event.status)}
                            </ToneBadge>
                          </div>
                        )}
                        <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-400)", marginTop: "4px" }}>
                          {formatRelativeTime(event.date)}
                        </div>
                      </td>
                      {isAdmin && event.type === "entry" && (
                        <td style={{ width: "60px", textAlign: "right" }}>
                          <EntryRowActions entryId={event._id} accounts={accounts} />
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>
        ))
      )}
    </main>
  );
}
