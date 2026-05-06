import type { EntryFields, ObligationDoc } from "@/lib/db/schema";
import type { Entry, Obligation } from "@/lib/types";
import type { Filter } from "mongodb";
import { ObjectId } from "mongodb";
import { getCollections } from "./context";
import type { DataQualityReport, DuplicateGroup, DuplicateObligation } from "./types";

export async function findDuplicateEntries(opts: { period?: string } = {}): Promise<DuplicateGroup[]> {
  const c = await getCollections();
  const filter: Filter<EntryFields> = {};
  if (opts.period) filter.month = opts.period;

  const entries = await c.entries.find(filter).sort({ date: -1 }).limit(500).toArray();

  const groups = new Map<string, Entry[]>();
  for (const e of entries) {
    const day = new Date(e.date).toISOString().slice(0, 10);
    const cp = (e.counterparty ?? "").toLowerCase().trim().replace(/\s+/g, " ");
    const key = `${day}|${e.amount}|${e.direction}|${cp}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(e);
  }

  const dupes: DuplicateGroup[] = [];
  for (const [key, items] of groups) {
    if (items.length < 2) continue;
    const [day, amountStr] = key.split("|");
    dupes.push({ key, date: day, amount: Number(amountStr), entries: items });
  }
  dupes.sort((a, b) => b.date.localeCompare(a.date));
  return dupes;
}

export async function findDuplicateObligations(opts: { month?: string } = {}): Promise<DuplicateObligation[]> {
  const c = await getCollections();
  const filter: Filter<ObligationDoc> = { type: "pengajuan" };
  if (opts.month) filter.month = opts.month;

  const obligations = await c.obligations.find(filter).sort({ created_at: -1 }).toArray();

  const byAmount = new Map<number, Obligation[]>();
  for (const ob of obligations) {
    const amount = ob.amount ?? 0;
    if (amount === 0) continue;
    if (!byAmount.has(amount)) byAmount.set(amount, []);
    byAmount.get(amount)!.push(ob);
  }

  const duplicates: DuplicateObligation[] = [];
  for (const [amount, items] of byAmount) {
    if (items.length > 1) {
      duplicates.push({ amount, obligations: items });
    }
  }

  duplicates.sort((a, b) => b.amount - a.amount);
  return duplicates;
}

export async function validateObligationData(opts: { month?: string } = {}): Promise<DataQualityReport> {
  const c = await getCollections();
  const filter: Filter<ObligationDoc> = { type: "pengajuan" };
  if (opts.month) filter.month = opts.month;

  const obligations = await c.obligations.find(filter).toArray();

  const missingFields: Record<string, number> = {};
  const requiredFields = ["item", "amount", "category", "requestor", "sumber_dana"];

  for (const ob of obligations) {
    for (const field of requiredFields) {
      const value = ob[field as keyof Obligation];
      if (value === null || value === undefined || value === "") {
        missingFields[field] = (missingFields[field] || 0) + 1;
      }
    }
  }

  const duplicateObligations = await findDuplicateObligations(opts);

  return {
    duplicateObligations,
    missingFields,
    totalObligations: obligations.length,
    duplicateCount: duplicateObligations.reduce((sum, dup) => sum + dup.obligations.length - 1, 0),
    missingFieldCount: Object.values(missingFields).reduce((sum, count) => sum + count, 0),
  };
}

export async function removeDuplicateObligations(keepFirst = true): Promise<{ removed: number; savedAmount: number }> {
  const c = await getCollections();

  const duplicates = await findDuplicateObligations();
  let removed = 0;
  let savedAmount = 0;

  for (const dup of duplicates) {
    const toRemove = keepFirst ? dup.obligations.slice(1) : dup.obligations.slice(0, -1);

    for (const ob of toRemove) {
      await c.obligations.deleteOne({ _id: new ObjectId(String(ob._id)) });
      removed++;
      savedAmount += ob.amount ?? 0;
    }
  }

  return { removed, savedAmount };
}
