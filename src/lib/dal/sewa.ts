import type { EntryFields } from "@/lib/db/schema";
import type { Filter } from "mongodb";
import { getCollections } from "./context";
import { getLedger } from "./ledgers";

export async function getSewaDanaUsage(tahap?: string) {
  const c = await getCollections();

  const sewaLedger = await getLedger("sewa");
  const targetTahap = tahap ?? sewaLedger?.period_code ?? sewaLedger?.period;

  const masukAgg = await c.entries
    .aggregate([
      {
        $match: {
          category: "sewa_masuk",
          direction: "in",
          ...(targetTahap ? { tahap_sewa: targetTahap } : {}),
        },
      },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ])
    .toArray();
  const totalMasuk = masukAgg[0]?.total ?? sewaLedger?.sewa?.total ?? 0;

  const filter: Filter<EntryFields> = {
    domain: "yayasan",
    direction: "out",
    dana_sumber: "sewa",
    ...(targetTahap ? { tahap_sewa: targetTahap } : {}),
  };

  const pengeluaranSewa = await c.entries.find(filter).sort({ date: -1 }).toArray();

  const totalTerpakai = pengeluaranSewa.reduce((s, e) => s + e.amount, 0);
  const sisaDana = totalMasuk - totalTerpakai;

  return {
    totalMasuk,
    pengeluaranSewa,
    totalTerpakai,
    sisaDana,
    tahap: targetTahap,
  };
}

export async function getPendingTransfers() {
  const ledger = await getLedger("sewa");
  const locations = ledger?.sewa?.locations ?? [];
  const pending = locations.filter((l) => l.pipeline?.stage && l.pipeline.stage !== "tercatat");
  const totalExpected = pending.reduce(
    (s, l) => s + (l.pipeline?.expected_amount ?? l.amount ?? 0),
    0,
  );
  return { pending, totalExpected };
}
