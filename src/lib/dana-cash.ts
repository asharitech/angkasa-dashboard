import { getDb } from "@/lib/mongodb";
import type { Account, Entry, Obligation } from "@/lib/types";
import type { Filter, Document } from "mongodb";

export async function getDanaCashSummary(opts: { period?: string } = {}) {
  const db = await getDb();

  const entryFilter: Record<string, unknown> = { account: "cash_yayasan", direction: "out" };
  if (opts.period) entryFilter.month = opts.period;

  const [account, pengeluaran, pengajuan] = await Promise.all([
    // Saldo cash yayasan
    db.collection("accounts").findOne({ _id: "cash_yayasan" } as unknown as Filter<Document>) as unknown as Promise<Account | null>,

    // Pengeluaran dari cash_yayasan (optionally filtered by bulan)
    db
      .collection("entries")
      .find(entryFilter as Filter<Document>)
      .sort({ date: -1 })
      .toArray() as unknown as Promise<Entry[]>,

    // Pengajuan yang bersumber dari cash_yayasan (bulan berjalan)
    db
      .collection("obligations")
      .find({ sumber_dana: "CASH_YAYASAN", status: "pending" } as Filter<Document>)
      .sort({ created_at: -1 })
      .toArray() as unknown as Promise<Obligation[]>,
  ]);

  const saldoAwal = (account as unknown as { meta?: { initial_amount?: number } })?.meta?.initial_amount ?? 0;
  const saldoSisa = (account as unknown as { balance?: number })?.balance ?? 0;
  const totalTerpakai = saldoAwal - saldoSisa;

  return {
    account: account as unknown as Account,
    saldoAwal,
    saldoSisa,
    totalTerpakai,
    pengeluaran: pengeluaran as unknown as Entry[],
    pengajuan: pengajuan as unknown as Obligation[],
  };
}
