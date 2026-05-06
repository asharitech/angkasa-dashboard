import { getAccounts } from "./accounts";
import { getCollections } from "./context";
import { getEntries } from "./entries";
import { getNumpangActive } from "./numpang";
import { getObligations } from "./obligations";
import { serializeDates } from "./serialize";

export async function getPribadiSummary() {
  const c = await getCollections();

  const [accounts, entries, savings, loans, recurring, piutangByMonth, savingsTotal, numpang] =
    await Promise.all([
      getAccounts(),
      getEntries({ owner: "angkasa", domain: { $ne: "yayasan" } }, 50),
      getEntries({ category: "savings" }, 50),
      getObligations({ type: "loan", status: "active" }),
      getObligations({ type: "recurring", status: "active" }),
      c.obligations
        .aggregate([
          { $match: { type: "pengajuan", status: "pending", sumber_dana: "BRI_ANGKASA" } },
          { $group: { _id: "$month", count: { $sum: 1 }, total: { $sum: "$amount" } } },
          { $sort: { _id: 1 } },
        ])
        .toArray(),
      c.entries
        .aggregate([
          { $match: { category: "savings" } },
          {
            $group: {
              _id: "$owner",
              count: { $sum: 1 },
              total: { $sum: "$amount" },
              total_in: { $sum: { $cond: [{ $eq: ["$direction", "in"] }, "$amount", 0] } },
              total_out: { $sum: { $cond: [{ $eq: ["$direction", "out"] }, "$amount", 0] } },
            },
          },
        ])
        .toArray(),
      getNumpangActive(),
    ]);

  const spending = entries.filter((e) => e.direction === "out" && e.category !== "savings");

  const personalAccounts = accounts.filter((a) => a.type !== "yayasan");

  return serializeDates({
    personalAccounts,
    spending,
    savings,
    savingsTotal: savingsTotal as {
      _id: string;
      count: number;
      total: number;
      total_in: number;
      total_out: number;
    }[],
    loans,
    recurring,
    piutangByMonth: piutangByMonth as { _id: string; count: number; total: number }[],
    numpang,
  });
}
