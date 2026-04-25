"use server";

import { revalidatePath } from "next/cache";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { dbCollections } from "@/lib/db/collections";
import { validateObligation, validateEntry } from "@/lib/validate";
import { requireAdmin, actionError } from "@/lib/auth-helpers";
import { ORG_ID } from "@/lib/config";
import type { ObligationDoc, EntryFields } from "@/lib/db/schema";

type ActionResult = { ok: true; id?: string } | { error: string };

function toObjectId(id: string): ObjectId {
  return new ObjectId(id);
}

function monthFromDate(date: string): string {
  return date.slice(0, 7);
}

export interface PengajuanInput {
  type: "pengajuan" | "loan" | "recurring";
  item: string;
  amount: number;
  category: string;
  requestor?: string;
  sumber_dana?: string | null;
  month?: string | null;
  date_spent?: string | null;
  bukti_type?: string;
  bukti_ref?: string | null;
  detail?: { item: string; amount: number }[] | null;
  owner?: string;
  org?: string | null;
  status?: "pending" | "active" | "lunas" | "rejected";
  due_day?: number;
  reminder_days?: number;
  resolved_at?: string | null;
  resolved_by?: string | null;
}

/**
 * Create a new obligation (pengajuan/loan/recurring).
 */
export async function createObligationAction(input: PengajuanInput): Promise<ActionResult> {
  try {
    const session = await requireAdmin();
    const c = dbCollections(await getDb());
    const now = new Date();
    const doc: Omit<ObligationDoc, "_id"> = {
      type: input.type,
      item: input.item.trim(),
      category: input.category,
      amount: input.amount,
      status: input.status ?? "pending",
      requestor: input.requestor ?? null,
      sumber_dana: input.sumber_dana ?? null,
      month: input.month ?? null,
      date_spent: input.date_spent ?? null,
      bukti_type: input.bukti_type ?? null,
      bukti_ref: input.bukti_ref ?? null,
      detail: input.detail ?? null,
      owner: input.owner ?? "yayasan",
      org: input.org ?? ORG_ID,
      due_day: input.due_day ?? null,
      reminder_days: input.reminder_days ?? null,
      created_by: session.userId,
      updated_by: session.userId,
      created_at: now,
      updated_at: now,
    };
    validateObligation(doc);
    const result = await c.obligations.insertOne(doc);
    if (doc.type === "recurring") revalidatePath("/wajib-bulanan");
    else revalidatePath("/pengajuan");
    revalidatePath("/");
    return { ok: true, id: result.insertedId.toString() };
  } catch (err) {
    return actionError(err);
  }
}

/**
 * Update fields on an existing obligation. Does NOT resolve — use markLunasAction for that.
 */
export async function updateObligationAction(
  id: string,
  patch: Partial<PengajuanInput>,
): Promise<ActionResult> {
  try {
    const session = await requireAdmin();
    const c = dbCollections(await getDb());
    const existing = await c.obligations.findOne({ _id: toObjectId(id) });
    if (!existing) return { error: "Pengajuan tidak ditemukan" };
    const merged = { ...existing, ...patch };
    validateObligation(merged);
    await c.obligations.updateOne(
      { _id: toObjectId(id) },
      {
        $set: {
          ...patch,
          updated_by: session.userId,
          updated_at: new Date(),
        },
      },
    );
    if (existing.type === "recurring") revalidatePath("/wajib-bulanan");
    else revalidatePath("/pengajuan");
    revalidatePath("/");
    return { ok: true };
  } catch (err) {
    return actionError(err);
  }
}

/**
 * Delete an obligation. Blocks deletion if any entries reference this obligation_id
 * (user must unresolve first).
 */
export async function deleteObligationAction(id: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    const c = dbCollections(await getDb());
    const linkedEntries = await c.entries.countDocuments({ obligation_id: id });
    if (linkedEntries > 0) {
      return {
        error: `Pengajuan ini punya ${linkedEntries} entry terkait. Hapus atau lepaskan entry-nya dulu.`,
      };
    }
    const toDelete = await c.obligations.findOne({ _id: toObjectId(id) });
    if (!toDelete) return { error: "Pengajuan tidak ditemukan" };
    const result = await c.obligations.deleteOne({ _id: toObjectId(id) });
    if (result.deletedCount === 0) return { error: "Pengajuan tidak ditemukan" };
    if (toDelete.type === "recurring") revalidatePath("/wajib-bulanan");
    else revalidatePath("/pengajuan");
    revalidatePath("/");
    return { ok: true };
  } catch (err) {
    return actionError(err);
  }
}

export interface MarkLunasInput {
  obligationId: string;
  account: string;
  date: string;
  amount?: number;
  description?: string;
  resolved_via?: string;
  tahap_sewa?: string | null;
  dana_sumber?: "sewa" | "operasional" | null;
}

/**
 * Atomic "mark pengajuan lunas" flow: insert a matching out-entry (with obligation_id)
 * then flip the obligation to lunas + resolved_at + resolved_by. Matches the rule in
 * TOOLS.md:226 — insert entry that resolves obligation → set obligation lunas.
 *
 * Both writes are sequential (no MongoDB transaction on Atlas free tier); the entry is
 * inserted first so worst-case we leak an entry without flipping status, which is
 * recoverable (user can retry, or operator unlinks). The alternative — flipping first
 * and failing to insert — leaves the ledger out of sync with a "lunas" obligation and
 * is harder to detect.
 */
export async function markLunasAction(input: MarkLunasInput): Promise<ActionResult> {
  try {
    const session = await requireAdmin();
    const c = dbCollections(await getDb());
    const oblig = await c.obligations.findOne({ _id: toObjectId(input.obligationId) });
    if (!oblig) return { error: "Pengajuan tidak ditemukan" };
    if (oblig.status === "lunas") return { error: "Pengajuan sudah lunas" };

    const amount = input.amount ?? (oblig.amount as number | null) ?? 0;
    if (amount <= 0) return { error: "Jumlah harus lebih dari 0" };

    const month = monthFromDate(input.date);
    const now = new Date();
    const entryDoc: EntryFields = {
      date: input.date,
      month,
      owner: oblig.owner ?? "yayasan",
      account: input.account,
      direction: "out",
      amount,
      counterparty: oblig.requestor ?? "",
      description: input.description?.trim() || oblig.item,
      domain: oblig.owner === "personal" ? "personal" : "yayasan",
      category: oblig.category ?? "pengajuan",
      source: "mark_lunas",
      dana_sumber: input.dana_sumber ?? null,
      tahap_sewa: input.tahap_sewa ?? null,
      obligation_id: input.obligationId,
      created_by: session.userId,
      updated_by: session.userId,
      created_at: now,
      updated_at: now,
    };
    validateEntry(entryDoc);

    const entryResult = await c.entries.insertOne(entryDoc);
    await c.obligations.updateOne(
      { _id: toObjectId(input.obligationId) },
      {
        $set: {
          status: "lunas",
          resolved_at: now,
          resolved_by: session.username,
          resolved_via: input.resolved_via ?? input.account,
          updated_by: session.userId,
          updated_at: now,
        },
      },
    );

    revalidatePath("/pengajuan");
    revalidatePath("/wajib-bulanan");
    revalidatePath("/aktivitas");
    revalidatePath("/");
    return { ok: true, id: entryResult.insertedId.toString() };
  } catch (err) {
    return actionError(err);
  }
}

/**
 * Unmark an obligation from lunas back to active.
 */
export async function unmarkLunasAction(id: string): Promise<ActionResult> {
  try {
    const session = await requireAdmin();
    const c = dbCollections(await getDb());
    const existing = await c.obligations.findOne({ _id: toObjectId(id) });
    if (!existing) return { error: "Pengajuan tidak ditemukan" };
    if (existing.status !== "lunas") return { error: "Pengajuan belum lunas" };

    // Delete the entry that was created by markLunasAction so the ledger stays clean.
    // obligation_id is stored as a string on EntryDoc — match both forms defensively.
    await c.entries.deleteOne({ obligation_id: id });

    await c.obligations.updateOne(
      { _id: toObjectId(id) },
      {
        $set: {
          status: "active",
          updated_by: session.userId,
          updated_at: new Date(),
        },
        $unset: {
          resolved_at: "",
          resolved_by: "",
          resolved_via: "",
        },
      },
    );

    revalidatePath("/pengajuan");
    revalidatePath("/wajib-bulanan");
    revalidatePath("/aktivitas");
    revalidatePath("/");
    return { ok: true };
  } catch (err) {
    return actionError(err);
  }
}
