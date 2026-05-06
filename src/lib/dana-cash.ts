import { ACCOUNTS } from "@/lib/config";
import { getCollections } from "@/lib/dal/context";
import type { EntryFields, ObligationDoc } from "@/lib/db/schema";
import type { Account, Obligation } from "@/lib/types";
import type { Filter } from "mongodb";

/** Rows for dana-cash table (serialized _id for RSC). */
export type DanaCashPengeluaranRow = {
  _id: string;
  date: string;
  description: string;
  amount: number;
};

export async function getDanaCashSummary(opts: { period?: string } = {}) {
  const c = await getCollections();

  const entryFilter: Filter<EntryFields> = {
    account: ACCOUNTS.cash,
    direction: "out",
    ...(opts.period ? { month: opts.period } : {}),
  };

  const [account, pengeluaranRaw, totalAgg, pengajuan] = await Promise.all([
    c.accounts.findOne({ _id: ACCOUNTS.cash }),

    c.entries.find(entryFilter).sort({ date: -1 }).toArray(),

    c.entries
      .aggregate<{ total: number }>([
        { $match: { account: ACCOUNTS.cash, direction: "out" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ])
      .toArray(),

    c.obligations
      .find({ sumber_dana: "CASH_YAYASAN", status: "pending" } satisfies Filter<ObligationDoc>)
      .sort({ created_at: -1 })
      .toArray(),
  ]);

  const pengeluaran: DanaCashPengeluaranRow[] = pengeluaranRaw.map((e) => ({
    _id: typeof e._id === "string" ? e._id : e._id.toString(),
    date: e.date,
    description: e.description,
    amount: e.amount,
  }));

  const saldoAwal = Number(account?.meta?.initial_amount ?? 0) || 0;
  const saldoSisa = account?.balance ?? 0;
  const totalTerpakai = totalAgg[0]?.total ?? 0;

  return {
    account: account as Account | null,
    saldoAwal,
    saldoSisa,
    totalTerpakai,
    pengeluaran,
    pengajuan: pengajuan as unknown as Obligation[],
  };
}
