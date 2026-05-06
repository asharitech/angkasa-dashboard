import type { EntryDirection, EntryFields, ObligationDoc } from "@/lib/db/schema";
import type { ActivityEvent, Obligation } from "@/lib/types";
import type { Filter } from "mongodb";
import { getCollections } from "./context";

export async function getActivityFeed(
  limit = 30,
  opts: { domain?: string; period?: string } = {},
): Promise<ActivityEvent[]> {
  const c = await getCollections();

  const pool = limit * 3;

  const entryFilter: Filter<EntryFields> = {};
  if (opts.domain) entryFilter.domain = opts.domain;
  if (opts.period) entryFilter.month = opts.period;

  const obligationFilter: Filter<ObligationDoc> = {};
  if (opts.period) obligationFilter.month = opts.period;

  const [entries, obligations] = await Promise.all([
    c.entries.find(entryFilter).sort({ date: -1, created_at: -1 }).limit(pool).toArray(),
    opts.domain
      ? Promise.resolve([] as Obligation[])
      : c.obligations.find(obligationFilter).sort({ updated_at: -1 }).limit(pool).toArray(),
  ]);

  const events: ActivityEvent[] = [];

  for (const e of entries) {
    events.push({
      _id: e._id.toString(),
      type: "entry",
      date: e.date?.toString() ?? e.created_at?.toString(),
      title: e.description ?? "Transaksi",
      subtitle: [e.domain, e.category?.replace(/_/g, " ")].filter(Boolean).join(" · "),
      amount: e.amount ?? null,
      direction: e.direction as EntryDirection,
      domain: e.domain,
      category: e.category,
      created_at: e.created_at?.toString() ?? e.date?.toString(),
    });
  }

  for (const o of obligations) {
    events.push({
      _id: o._id.toString(),
      type: "obligation",
      date: o.updated_at?.toString() ?? o.created_at?.toString(),
      title: o.item ?? "Obligation",
      subtitle: [o.type, o.requestor].filter(Boolean).join(" · "),
      amount: o.amount ?? null,
      status: o.status,
      category: o.category,
      created_at: o.created_at?.toString(),
    });
  }

  events.sort((a, b) => {
    const dateA = new Date(a.date ?? a.created_at).getTime();
    const dateB = new Date(b.date ?? b.created_at).getTime();
    if (dateB !== dateA) return dateB - dateA;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
  return events.slice(0, limit);
}
