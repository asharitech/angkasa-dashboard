import type { EntryFields } from "@/lib/db/schema";
import type { Entry } from "@/lib/types";
import type { Filter } from "mongodb";
import { ObjectId } from "mongodb";
import { getCollections } from "./context";

export async function getEntries(filter: Filter<EntryFields> = {}, limit = 50): Promise<Entry[]> {
  const c = await getCollections();
  return c.entries.find(filter).sort({ date: -1 }).limit(limit).toArray();
}

export async function deleteEntry(id: string): Promise<void> {
  const c = await getCollections();
  await c.entries.deleteOne({ _id: new ObjectId(id) });
}
