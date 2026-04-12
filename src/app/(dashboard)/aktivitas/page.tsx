import { getActivityFeed } from "@/lib/data";
import { formatRupiah, formatRelativeTime, formatDateShort } from "@/lib/format";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import {
  Activity,
  ArrowDownLeft,
  ArrowUpRight,
  Receipt,
  CreditCard,
  Repeat,
} from "lucide-react";

export const dynamic = "force-dynamic";

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

export default async function AktivitasPage() {
  const events = await getActivityFeed(50);

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
                          variant={event.status === "pending" ? "secondary" : "outline"}
                          className="text-xs mt-0.5"
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
