"use server";

import { revalidatePath } from "next/cache";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { dbCollections } from "@/lib/db/collections";
import { validateEntry } from "@/lib/validate";
import { requireAdmin, actionError } from "@/lib/auth-helpers";
import type { Entry } from "@/lib/types";
import type { EntryFields } from "@/lib/db/schema";

type ActionResult = { ok: true; id?: string } | { error: string };

export async function getEntryByIdAction(
  id: string,
): Promise<{ entry: Entry } | { error: string }> {
  try {
    await requireAdmin();
    const c = dbCollections(await getDb());
    const doc = await c.entries.findOne({ _id: toObjectId(id) });
    if (!doc) return { error: "Entry tidak ditemukan" };
    return {
      entry: {
        ...doc,
        _id: doc._id.toString(),
      } as unknown as Entry,
    };
  } catch (err) {
    return actionError(err);
  }
}

function toObjectId(id: string): ObjectId {
  return new ObjectId(id);
}

function monthFromDate(date: string): string {
  return date.slice(0, 7);
}

export interface EntryInput {
  date: string;
  account: string;
  direction: "in" | "out";
  amount: number;
  counterparty?: string;
  description: string;
  domain: "yayasan" | "personal";
  category: string;
  owner?: string;
  dana_sumber?: "sewa" | "operasional" | null;
  tahap_sewa?: string | null;
  source?: string;
  ref_no?: string | null;
}

export async function createEntryAction(input: EntryInput): Promise<ActionResult> {
  try {
    const session = await requireAdmin();
    const c = dbCollections(await getDb());
    const now = new Date();
    const doc: EntryFields = {
      date: input.date,
      month: monthFromDate(input.date),
      account: input.account,
      direction: input.direction,
      amount: input.amount,
      counterparty: input.counterparty ?? "",
      description: input.description.trim(),
      domain: input.domain,
      category: input.category.trim().toLowerCase().replace(/\s+/g, "_"),
      owner: input.owner ?? (input.domain === "personal" ? "angkasa" : "yayasan"),
      dana_sumber: input.dana_sumber ?? null,
      tahap_sewa: input.tahap_sewa ?? null,
      source: input.source ?? "manual",
      ref_no: input.ref_no ?? null,
      created_by: session.userId,
      updated_by: session.userId,
      created_at: now,
      updated_at: now,
    };
    validateEntry(doc);
    const result = await c.entries.insertOne(doc);
    revalidatePath("/aktivitas");
    revalidatePath("/");
    revalidatePath("/laporan-op");
    return { ok: true, id: result.insertedId.toString() };
  } catch (err) {
    return actionError(err);
  }
}

export async function updateEntryAction(
  id: string,
  patch: Partial<EntryInput>,
): Promise<ActionResult> {
  try {
    const session = await requireAdmin();
    const c = dbCollections(await getDb());
    const existing = await c.entries.findOne({ _id: toObjectId(id) });
    if (!existing) return { error: "Entry tidak ditemukan" };
    const month = patch.date ? monthFromDate(patch.date) : undefined;
    const merged: EntryFields = { ...existing, ...patch, ...(month ? { month } : {}) };
    validateEntry(merged);
    const update: Partial<EntryFields> & { updated_by: string; updated_at: Date } = {
      ...patch,
      ...(month ? { month } : {}),
      updated_by: session.userId,
      updated_at: new Date(),
    };
    await c.entries.updateOne({ _id: toObjectId(id) }, { $set: update });
    revalidatePath("/aktivitas");
    revalidatePath("/");
    revalidatePath("/laporan-op");
    return { ok: true };
  } catch (err) {
    return actionError(err);
  }
}

/**
 * Delete an entry. Blocks if this entry resolved an obligation (has obligation_id set);
 * user must first unresolve the obligation. Prevents silent drift between ledger and
 * pengajuan status.
 */
export async function deleteEntryAction(id: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    const c = dbCollections(await getDb());
    const entry = await c.entries.findOne({ _id: toObjectId(id) });
    if (!entry) return { error: "Entry tidak ditemukan" };
    if (entry.obligation_id) {
      return {
        error:
          "Entry ini terkait dengan pengajuan yang sudah lunas. Batalkan lunas-nya dulu dari halaman Pengajuan.",
      };
    }
    await c.entries.deleteOne({ _id: toObjectId(id) });
    revalidatePath("/aktivitas");
    revalidatePath("/");
    revalidatePath("/laporan-op");
    return { ok: true };
  } catch (err) {
    return actionError(err);
  }
}
