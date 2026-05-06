import type { AgendaListItem } from "./types";
import { getCollections } from "./context";
import { serializeDates } from "./serialize";

export async function getAgendaForOwner(owner: string): Promise<AgendaListItem[]> {
  const c = await getCollections();
  const docs = await c.agenda
    .find({ owner })
    .sort({ due_date: 1, created_at: -1 })
    .toArray();

  return serializeDates(
    docs.map((d) => ({
      _id: d._id.toString(),
      title: d.title,
      description: d.description ?? null,
      due_date: d.due_date,
      priority: d.priority as AgendaListItem["priority"],
      kategori: d.kategori ?? "lainnya",
      status: d.status as AgendaListItem["status"],
      tags: d.tags ?? [],
      completed_at: d.completed_at ?? null,
      created_at: d.created_at ?? null,
      updated_at: d.updated_at ?? null,
    })),
  ) as AgendaListItem[];
}
