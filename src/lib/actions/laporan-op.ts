"use server"

import { revalidatePath } from "next/cache"
import { getDb } from "@/lib/mongodb"
import { dbCollections } from "@/lib/db/collections"
import { getSession } from "@/lib/auth"
import { ACCOUNTS } from "@/lib/config"

/**
 * Syncs laporan_op.totals from live btn_yayasan entries.
 * Leaves kewajiban and entries[] (the snapshot rows) untouched.
 * Returns an error string on failure, null on success.
 */
export async function refreshLaporanOpTotals(): Promise<{ error?: string }> {
  const session = await getSession()
  if (session?.role !== "admin") return { error: "Unauthorized" }

  const c = dbCollections(await getDb())

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
