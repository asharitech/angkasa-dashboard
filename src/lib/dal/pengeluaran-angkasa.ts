import type { Entry } from "@/lib/types";
import { currentWitaMonth } from "@/lib/periods";
import { getCollections } from "./context";
import { serializeDates } from "./serialize";

export async function getPengeluaranAngkasa(month?: string) {
  const c = await getCollections();

  const baseFilter: Record<string, unknown> = { owner: "angkasa", domain: "personal" };
  const monthFilter: Record<string, unknown> = month ? { ...baseFilter, month } : baseFilter;

  const [entriesOut, entriesIn, allMonthsRaw, categorySummary, monthlyCashflow, loanSchedules] = await Promise.all([
    c.entries.find({ ...monthFilter, direction: "out" }).sort({ date: -1 }).toArray(),
    c.entries.find({ ...monthFilter, direction: "in" }).sort({ date: -1 }).toArray(),
    c.entries.distinct("month", baseFilter),
    c.entries
      .aggregate([
        { $match: { ...monthFilter, direction: "out" } },
        { $group: { _id: "$category", count: { $sum: 1 }, total: { $sum: "$amount" } } },
        { $sort: { total: -1 } },
      ])
      .toArray(),
    c.entries
      .aggregate([
        { $match: baseFilter },
        { $group: { _id: { month: "$month", direction: "$direction" }, total: { $sum: "$amount" } } },
        { $sort: { "_id.month": -1 } },
      ])
      .toArray(),
    c.obligations.find({ type: "loan", status: "active" }).toArray(),
  ]);

  const allMonths = (allMonthsRaw as unknown[]).filter(
    (m): m is string => typeof m === "string" && /^\d{4}-\d{2}$/.test(m),
  );

  const paidLoanEntries: Entry[] = [];
  const targetMonth = month ?? currentWitaMonth();

  for (const loan of loanSchedules) {
    const sched = (loan.schedule ?? []).find((s) => s.month === targetMonth && s.status === "lunas");
    if (sched) {
      const alreadyExists = entriesOut.some(
        (e) =>
          e.amount === sched.amount &&
          (e.category === "cicilan" ||
            e.category === "loan" ||
            (e.description || "").toLowerCase().includes(loan.item.toLowerCase())),
      );

      if (!alreadyExists) {
        const paidAt = sched.paid_at ? new Date(sched.paid_at) : new Date();
        const dateStr = paidAt.toISOString().substring(0, 10);
        paidLoanEntries.push({
          _id: `loan_${String(loan._id)}_${targetMonth}`,
          date: dateStr,
          month: targetMonth,
          owner: "angkasa",
          account: "bri_angkasa",
          direction: "out",
          amount: sched.amount,
          counterparty: "",
          description: `Cicilan: ${loan.item}`,
          domain: "personal",
          category: "cicilan",
          source: "loan_schedule",
          created_at: paidAt,
          updated_at: paidAt,
          is_virtual: true,
        } as unknown as Entry);
      }
    }
  }

  const allEntriesOut = [...entriesOut, ...paidLoanEntries].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  const entries = [...allEntriesOut, ...entriesIn].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  const cashflowMap = new Map<string, { in: number; out: number }>();
  for (const m of allMonths) cashflowMap.set(m, { in: 0, out: 0 });
  for (const row of monthlyCashflow) {
    const m = row._id.month as string | null | undefined;
    if (m == null || typeof m !== "string" || !/^\d{4}-\d{2}$/.test(m)) continue;
    const d = row._id.direction as string;
    const cur = cashflowMap.get(m) ?? { in: 0, out: 0 };
    if (d === "in") cur.in = row.total;
    if (d === "out") cur.out = row.total;
    cashflowMap.set(m, cur);
  }

  const currentCashflow = month
    ? (cashflowMap.get(month) ?? { in: 0, out: 0 })
    : (cashflowMap.get(targetMonth) ?? { in: 0, out: 0 });
  if (targetMonth === (month ?? currentWitaMonth())) {
    currentCashflow.out += paidLoanEntries.reduce((s, e) => s + e.amount, 0);
  }

  return serializeDates({
    entries,
    entriesOut: allEntriesOut,
    entriesIn,
    months: [...allMonths].sort().reverse(),
    categorySummary: categorySummary as { _id: string; count: number; total: number }[],
    totalOut: allEntriesOut.reduce((s, e) => s + e.amount, 0),
    totalIn: entriesIn.reduce((s, e) => s + e.amount, 0),
    countOut: allEntriesOut.length,
    countIn: entriesIn.length,
    cashflowByMonth: Object.fromEntries(cashflowMap),
    currentCashflow,
  });
}
