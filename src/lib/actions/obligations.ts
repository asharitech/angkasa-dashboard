"use server";

import { revalidatePath } from "next/cache";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { validateObligation, validateEntry } from "@/lib/validate";
import { requireAdmin, actionError } from "@/lib/auth-helpers";

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
  due_day?: number | null;
  frequency?: string | null;
  is_active?: boolean;
  tags?: string[];
}

/**
 * Create a new obligation (pengajuan/loan/recurring).
 */
export async function createObligationAction(input: PengajuanInput): Promise<ActionResult> {
  try {
    const session = await requireAdmin();
    const db = await getDb();
    const now = new Date();
    const doc: Record<string, unknown> = {
      type: input.type,
      item: input.item.trim(),
      category: input.category,
      amount: input.amount,
      status: "pending",
      requestor: input.requestor ?? null,
      sumber_dana: input.sumber_dana ?? null,
      month: input.month ?? null,
      date_spent: input.date_spent ?? null,
      bukti_type: input.bukti_type ?? null,
      bukti_ref: input.bukti_ref ?? null,
      detail: input.detail ?? null,
      owner: input.owner ?? "yayasan",
      org: input.org ?? "yrbb",
      due_day: input.due_day ?? null,
      frequency: input.frequency ?? null,
      is_active: input.is_active ?? (input.type === "recurring" ? true : undefined),
      tags: input.tags ?? null,
      created_by: session.userId,
      updated_by: session.userId,
      created_at: now,
      updated_at: now,
    };
    validateObligation(doc);
    const result = await db.collection("obligations").insertOne(doc);
    revalidatePath("/pengajuan");
    revalidatePath("/yayasan-rutin");
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
    const db = await getDb();
    const existing = await db.collection("obligations").findOne({ _id: toObjectId(id) });
    if (!existing) return { error: "Pengajuan tidak ditemukan" };
    const merged = { ...existing, ...patch };
    validateObligation(merged);
    await db.collection("obligations").updateOne(
      { _id: toObjectId(id) },
      {
        $set: {
          ...patch,
          updated_by: session.userId,
          updated_at: new Date(),
        },
      },
    );
    revalidatePath("/pengajuan");
    revalidatePath("/yayasan-rutin");
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
    const db = await getDb();
    const linkedEntries = await db.collection("entries").countDocuments({ obligation_id: id });
    if (linkedEntries > 0) {
      return {
        error: `Pengajuan ini punya ${linkedEntries} entry terkait. Hapus atau lepaskan entry-nya dulu.`,
      };
    }
    const result = await db.collection("obligations").deleteOne({ _id: toObjectId(id) });
    if (result.deletedCount === 0) return { error: "Pengajuan tidak ditemukan" };
    revalidatePath("/pengajuan");
    revalidatePath("/yayasan-rutin");
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
    const db = await getDb();
    const oblig = await db.collection("obligations").findOne({ _id: toObjectId(input.obligationId) });
    if (!oblig) return { error: "Pengajuan tidak ditemukan" };
    if (oblig.status === "lunas") return { error: "Pengajuan sudah lunas" };

    const amount = input.amount ?? (oblig.amount as number | null) ?? 0;
    if (amount <= 0) return { error: "Jumlah harus lebih dari 0" };

    const month = monthFromDate(input.date);
    const entryDoc: Record<string, unknown> = {
      date: input.date,
      month,
      owner: oblig.owner ?? "yayasan",
      account: input.account,
      direction: "out",
      amount,
      counterparty: (oblig.requestor as string | undefined) ?? "",
      description: input.description?.trim() || (oblig.item as string),
      domain: oblig.owner === "personal" ? "personal" : "yayasan",
      category: (oblig.category as string) ?? "pengajuan",
      source: "mark_lunas",
      dana_sumber: input.dana_sumber ?? null,
      tahap_sewa: input.tahap_sewa ?? null,
      obligation_id: input.obligationId,
      created_by: session.userId,
      updated_by: session.userId,
      created_at: new Date(),
      updated_at: new Date(),
    };
    validateEntry(entryDoc);

    const now = new Date();
    const entryResult = await db.collection("entries").insertOne(entryDoc);
    await db.collection("obligations").updateOne(
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
    revalidatePath("/aktivitas");
    revalidatePath("/");
    return { ok: true, id: entryResult.insertedId.toString() };
  } catch (err) {
    return actionError(err);
  }
}
