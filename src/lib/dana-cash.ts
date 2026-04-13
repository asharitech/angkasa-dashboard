import { getDb } from "@/lib/mongodb";
import type { Account, Entry, Obligation } from "@/lib/types";

export async function getDanaCashSummary() {
  const db = await getDb();

  const [account, pengeluaran, pengajuan] = await Promise.all([
    // Saldo cash yayasan
    db.collection("accounts").findOne({ _id: "cash_yayasan" as any }) as unknown as Promise<Account | null>,

    // Semua pengeluaran dari cash_yayasan
    db
      .collection("entries")
      .find({ account: "cash_yayasan" as any, direction: "out" })
      .sort({ date: -1 })
      .toArray() as unknown as Promise<Entry[]>,

    // Pengajuan yang bersumber dari cash_yayasan (bulan berjalan)
    db
      .collection("obligations")
      .find({ sumber_dana: "CASH_YAYASAN" as any, status: "pending" })
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
