import { getActivityFeed } from "@/lib/data";
import { formatRupiah, formatRelativeTime, formatDateShort } from "@/lib/format";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  Activity,
  ArrowDownLeft,
  ArrowUpRight,
  Receipt,
  CreditCard,
  Repeat,
} from "lucide-react";

export const dynamic = "force-dynamic";

const TYPE_TABS = [
  { value: "all", label: "Semua" },
  { value: "entry", label: "Transaksi" },
  { value: "obligation", label: "Pengajuan" },
];

const DOMAIN_TABS = [
  { value: "all", label: "Semua Domain" },
  { value: "yayasan", label: "Yayasan" },
  { value: "personal", label: "Pribadi" },
];

const obligationStatusStyles: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  lunas: "bg-emerald-50 text-emerald-700 border-emerald-200",
  reimbursed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  approved: "bg-blue-50 text-blue-700 border-blue-200",
  rejected: "bg-rose-50 text-rose-700 border-rose-200",
};

function EventIcon({ event }: { event: { type: string; direction?: string; domain?: string } }) {
  if (event.type === "entry") {
    return event.direction === "in" ? (
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
        <ArrowDownLeft className="h-4 w-4" />
      </div>
    ) : (
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-50 text-rose-600">
        <ArrowUpRight className="h-4 w-4" />
      </div>
    );
  }

  // obligation
  const iconMap: Record<string, { icon: typeof Receipt; bg: string; color: string }> = {
    pengajuan: { icon: Receipt, bg: "bg-amber-50", color: "text-amber-600" },
    loan: { icon: CreditCard, bg: "bg-violet-50", color: "text-violet-600" },
    recurring: { icon: Repeat, bg: "bg-blue-50", color: "text-blue-600" },
  };
  const cfg = iconMap[event.domain ?? ""] ?? iconMap.pengajuan;
  const Icon = cfg.icon;
  return (
    <div className={`flex h-8 w-8 items-center justify-center rounded-full ${cfg.bg} ${cfg.color}`}>
      <Icon className="h-4 w-4" />
    </div>
  );
}

export default async function AktivitasPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; domain?: string }>;
}) {
  const params = await searchParams;
  const typeFilter = params.type ?? "all";
  const domainFilter = params.domain ?? "all";

  const allEvents = await getActivityFeed(
    50,
    domainFilter !== "all" ? { domain: domainFilter } : {},
  );

  const events =
    typeFilter === "all"
      ? allEvents
      : allEvents.filter((e) => {
          if (typeFilter === "entry") return e.type === "entry";
          if (typeFilter === "obligation") return e.type === "obligation";
          return true;
        });

  function buildHref(next: { type?: string; domain?: string }) {
    const qs = new URLSearchParams();
    const t = next.type ?? typeFilter;
    const d = next.domain ?? domainFilter;
    if (t !== "all") qs.set("type", t);
    if (d !== "all") qs.set("domain", d);
    const s = qs.toString();
    return s ? `/aktivitas?${s}` : "/aktivitas";
  }

  // Group by date
  const grouped = new Map<string, typeof events>();
  for (const event of events) {
    const day = new Date(event.date).toISOString().slice(0, 10);
    if (!grouped.has(day)) grouped.set(day, []);
    grouped.get(day)!.push(event);
  }

  return (
    <div className="space-y-6">
      <PageHeader icon={Activity} title="Aktivitas" />

      {/* Type filter tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {TYPE_TABS.map((tab) => {
          const isActive = tab.value === typeFilter;
          return (
            <Link
              key={tab.value}
              href={buildHref({ type: tab.value })}
              className={cn(
                "shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      {/* Domain filter tabs (entries only) */}
      {typeFilter !== "obligation" && (
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {DOMAIN_TABS.map((tab) => {
            const isActive = tab.value === domainFilter;
            return (
              <Link
                key={tab.value}
                href={buildHref({ domain: tab.value })}
                className={cn(
                  "shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors border",
                  isActive
                    ? "bg-foreground text-background border-foreground"
                    : "bg-background text-muted-foreground border-border hover:text-foreground"
                )}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>
      )}

      {events.length === 0 ? (
        <p className="text-muted-foreground text-center py-10">
          Belum ada aktivitas.
        </p>
      ) : (
        Array.from(grouped.entries()).map(([day, dayEvents]) => (
          <div key={day}>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
              {formatDateShort(day)}
            </p>
            <Card className="shadow-sm">
              <CardContent className="divide-y divide-border/50 p-0">
                {dayEvents.map((event) => (
                  <div key={event._id} className="flex items-start gap-3 px-4 py-3">
                    <div className="mt-0.5">
                      <EventIcon event={event} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{event.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {event.subtitle}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      {event.amount != null && event.amount > 0 && (
                        <p
                          className={`text-sm font-semibold tabular-nums ${
                            event.direction === "in"
                              ? "text-emerald-600"
                              : event.direction === "out"
                                ? "text-rose-600"
                                : ""
                          }`}
                        >
                          {event.direction === "in" ? "+" : event.direction === "out" ? "-" : ""}
                          {formatRupiah(event.amount)}
                        </p>
                      )}
                      {event.status && (
                        <Badge
                          className={`text-xs mt-0.5 font-medium border ${
                            obligationStatusStyles[event.status] ?? "bg-secondary text-secondary-foreground"
                          }`}
                        >
                          {event.status}
                        </Badge>
                      )}
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatRelativeTime(event.date)}
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        ))
      )}
    </div>
  );
}
