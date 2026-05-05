"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/mongodb";
import { dbCollections } from "@/lib/db/collections";
import { requireAdmin, actionError } from "@/lib/auth-helpers";

type ActionResult = { ok: true } | { error: string };

function witaToday(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Makassar",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const y = parts.find((p) => p.type === "year")?.value ?? "1970";
  const m = parts.find((p) => p.type === "month")?.value ?? "01";
  const d = parts.find((p) => p.type === "day")?.value ?? "01";
  return `${y}-${m}-${d}`;
}

export interface BalanceAdjustmentInput {
  accountId: string;
  newBalance: number;
  reason: string;
  notes?: string;
}

/**
 * Reconcile an account balance by recording a synthetic balance_adjustment
 * entry (direction inferred from delta) rather than silently overwriting
 * accounts.balance.
 */
export async function adjustAccountBalanceAction(
  input: BalanceAdjustmentInput,
): Promise<ActionResult> {
  try {
    const session = await requireAdmin();
    const c = dbCollections(await getDb());

    if (!Number.isFinite(input.newBalance)) {
      return { error: "Saldo baru tidak valid" };
    }
    if (!input.reason.trim()) {
      return { error: "Alasan penyesuaian wajib diisi" };
    }

    const account = await c.accounts.findOne({ _id: input.accountId });
    if (!account) return { error: "Rekening tidak ditemukan" };

    const current = (account as { balance?: number }).balance ?? 0;
    const delta = input.newBalance - current;
    if (delta === 0) return { error: "Saldo baru sama dengan saldo sekarang" };

    const today = witaToday();
    const direction: "in" | "out" = delta > 0 ? "in" : "out";
    const amount = Math.abs(delta);
    const owner =
      (account as { owner?: string }).owner ??
      (input.accountId.includes("angkasa") ? "angkasa" : "yayasan");
    const domain: "yayasan" | "personal" =
      (account as { type?: string }).type === "yayasan" ? "yayasan" : "personal";

    const now = new Date();
    const description = input.reason.trim();

    await c.entries.insertOne({
      date: today,
      month: today.slice(0, 7),
      account: input.accountId,
      direction,
      amount,
      counterparty: "",
      description,
      domain,
      category: "balance_adjustment",
      owner,
      dana_sumber: null,
      tahap_sewa: null,
      source: "adjustment",
      ref_no: null,
      notes: input.notes?.trim() || null,
      created_by: session.userId,
      updated_by: session.userId,
      created_at: now,
      updated_at: now,
    });

    await c.accounts.updateOne(
      { _id: input.accountId },
      {
        $set: {
          balance: input.newBalance,
          balance_as_of: today,
          balance_source: "adjustment",
          updated_at: now,
        },
      },
    );

    revalidatePath("/");
    revalidatePath("/pribadi");
    revalidatePath("/aktivitas");
    revalidatePath("/laporan-op");
    revalidatePath("/anggaran");
    return { ok: true };
  } catch (err) {
    return actionError(err);
  }
}

/**
 * Direct balance update (requested for Budget Page quick edits)
 */
export async function updateAccountBalanceAction(accountId: string, newBalance: number): Promise<ActionResult> {
  try {
    const c = dbCollections(await getDb());
    
    if (accountId === "bri_kas_virtual") {
      const numpangActive = await c.numpang.find({ status: "active" }).toArray();
      const numpangTotal = numpangActive.reduce((s, n) => s + n.amount, 0);
      const newBriTotal = newBalance + numpangTotal;
      
      await c.accounts.updateOne(
        { _id: "bri_angkasa" },
        { $set: { balance: newBriTotal, updated_at: new Date() } }
      );
    } else {
      await c.accounts.updateOne(
        { _id: accountId },
        { $set: { balance: newBalance, updated_at: new Date() } }
      );
    }

    revalidatePath("/anggaran");
    revalidatePath("/");
    return { ok: true };
  } catch (e: any) {
    return { error: e.message };
  }
}
