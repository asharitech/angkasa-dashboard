"use server"

import { revalidatePath } from "next/cache"
import { ObjectId } from "mongodb"
import { getSession } from "@/lib/auth"
import { ACCOUNTS } from "@/lib/config"
import { getCollections } from "@/lib/dal/context";

/**
 * Syncs laporan_op.totals from live btn_yayasan entries.
 * Leaves kewajiban and entries[] (the snapshot rows) untouched.
 * Returns an error string on failure, null on success.
 */
export async function refreshLaporanOpTotals(): Promise<{ error?: string }> {
  const session = await getSession()
  if (session?.role !== "admin") return { error: "Unauthorized" }

  const c = await getCollections()

  const ledger = await c.ledgers.findOne({ type: "laporan_op", is_current: true })
  if (!ledger?.laporan_op) return { error: "Ledger tidak ditemukan" }

  const agg = await c.entries.aggregate([
    { $match: { account: ACCOUNTS.operasional } },
    { $group: { _id: "$direction", total: { $sum: "$amount" } } },
  ]).toArray()

  const masuk = agg.find((a) => a._id === "in")?.total ?? 0
  const keluar = agg.find((a) => a._id === "out")?.total ?? 0
  const saldo = masuk - keluar
  const dana_efektif = saldo - (ledger.laporan_op.kewajiban?.total ?? 0)

  await c.ledgers.updateOne(
    { _id: ledger._id },
    {
      $set: {
        "laporan_op.totals.masuk": masuk,
        "laporan_op.totals.keluar": keluar,
        "laporan_op.totals.saldo": saldo,
        "laporan_op.dana_efektif": dana_efektif,
        updated_at: new Date(),
      },
    },
  )

  revalidatePath("/laporan-op")
  revalidatePath("/")
  return {}
}

export interface UpdateLaporanOpInput {
  period: string;
  period_code?: string | null;
  as_of?: string | null;
  is_current?: boolean;
  laporan_op?: {
    dana_efektif?: number;
    totals?: {
      masuk: number;
      keluar: number;
      saldo: number;
    };
    kewajiban?: {
      total: number;
      fields: Record<string, number>;
    };
  };
}

export async function updateLaporanOpAction(id: string, input: UpdateLaporanOpInput): Promise<{ ok?: boolean; error?: string }> {
  const session = await getSession()
  if (session?.role !== "admin") return { error: "Unauthorized" }

  const c = await getCollections()

  const updateData: Record<string, unknown> = {
    period: input.period,
    period_code: input.period_code ?? null,
    is_current: input.is_current ?? false,
    updated_at: new Date(),
  }

  if (input.as_of) updateData.as_of = new Date(input.as_of);
  if (input.laporan_op) {
    if (input.laporan_op.dana_efektif !== undefined) updateData["laporan_op.dana_efektif"] = input.laporan_op.dana_efektif;
    if (input.laporan_op.totals) {
      updateData["laporan_op.totals.masuk"] = input.laporan_op.totals.masuk;
      updateData["laporan_op.totals.keluar"] = input.laporan_op.totals.keluar;
      updateData["laporan_op.totals.saldo"] = input.laporan_op.totals.saldo;
    }
    if (input.laporan_op.kewajiban) {
      await c.ledgers.updateOne(
        { _id: new ObjectId(id) },
        { $set: { "laporan_op.kewajiban": { total: input.laporan_op.kewajiban.total, ...input.laporan_op.kewajiban.fields } } }
      );
    }
  }

  await c.ledgers.updateOne(
    { _id: new ObjectId(id) },
    { $set: updateData }
  )

  revalidatePath("/laporan-op")
  revalidatePath("/")
  return { ok: true }
}


