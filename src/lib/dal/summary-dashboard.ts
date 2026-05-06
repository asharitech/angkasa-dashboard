import { ACCOUNTS } from "@/lib/config";
import { getAccounts } from "./accounts";
import { getCollections } from "./context";
import { getLedger } from "./ledgers";
import { getWajibBulanan } from "./obligations";

export async function getDashboardSummary() {
  const c = await getCollections();

  const [accounts, laporanOp, sewa, pengajuanPending, pengajuanTotal, pengajuanByRequestor, cashAccount, wajibBulanan] =
    await Promise.all([
      getAccounts(),
      getLedger("laporan_op"),
      getLedger("sewa"),
      c.obligations.countDocuments({ type: "pengajuan", status: "pending" }),
      c.obligations
        .aggregate([
          { $match: { type: "pengajuan", status: "pending" } },
          { $group: { _id: null, total: { $sum: "$amount" } } },
        ])
        .toArray(),
      c.obligations
        .aggregate([
          { $match: { type: "pengajuan", status: "pending" } },
          { $group: { _id: "$requestor", count: { $sum: 1 }, total: { $sum: "$amount" } } },
          { $sort: { total: -1 } },
        ])
        .toArray(),
      c.accounts.findOne({ _id: ACCOUNTS.cash }),
      getWajibBulanan(),
    ]);

  const cashAwal = Number(cashAccount?.meta?.initial_amount ?? 0) || 0;
  const cashSisa = cashAccount?.balance ?? 0;

  return {
    accounts,
    laporanOp,
    sewa,
    pengajuanPending,
    pengajuanTotalAmount: pengajuanTotal[0]?.total ?? 0,
    pengajuanByRequestor: pengajuanByRequestor as { _id: string; count: number; total: number }[],
    cashYayasan: { awal: cashAwal, sisa: cashSisa, terpakai: cashAwal - cashSisa },
    wajibBulanan,
  };
}
