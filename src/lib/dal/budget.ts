import { ACCOUNTS } from "@/lib/config";
import type { BudgetConfigDoc } from "@/lib/db/schema";
import type { Entry } from "@/lib/types";
import { currentWitaMonth } from "@/lib/periods";
import { computeBriKas } from "./accounts";
import { getCollections } from "./context";
import { serializeDates } from "./serialize";
import type { BudgetSummary } from "./types";

export async function getBudgetConfig(month?: string) {
  const c = await getCollections();
  const cfg = await c.budget_configs.findOne({ _id: "angkasa" });
  if (cfg) return serializeDates(cfg);

  const now = new Date();
  const defaultMonth = month ?? currentWitaMonth();
  const defaultConfig = {
    _id: "angkasa",
    monthly_income: 10_000_000,
    bonus_income: 0,
    fixed_deductions: [
      { name: "Cicilan", amount: 6_000_000, type: "loan" as const, obligation_id: null },
    ],
    categories: [
      { key: "belanja", name: "Belanja", limit: 2_000_000, color: "#3b82f6" },
      { key: "makan_minum", name: "Makan / Minum", limit: 1_000_000, color: "#f59e0b" },
      { key: "lainnya", name: "Lain-lain (kado, tak terduga)", limit: 500_000, color: "#8b5cf6" },
      { key: "savings", name: "Tabungan", limit: 500_000, color: "#10b981" },
    ],
    month: defaultMonth,
    created_at: now,
    updated_at: now,
  };
  await c.budget_configs.insertOne({ ...defaultConfig });
  return serializeDates(defaultConfig);
}

export async function getBudgetSummary(month?: string): Promise<BudgetSummary> {
  const c = await getCollections();
  const targetMonth = month ?? currentWitaMonth();

  const [configRaw, bcaAccount, briKasData, personalOut, loanSchedules, recurring] = await Promise.all([
    getBudgetConfig(targetMonth),
    c.accounts.findOne({ _id: ACCOUNTS.personalBca }),
    computeBriKas(),
    c.entries
      .find({
        owner: "angkasa",
        domain: "personal",
        direction: "out",
        month: targetMonth,
        category: { $ne: "savings" },
      })
      .toArray(),
    c.obligations.find({ type: "loan", status: "active" }).toArray(),
    c.obligations
      .find({
        type: "recurring",
        status: "active",
        $or: [{ month: targetMonth }, { month: null }, { month: { $exists: false } }],
      })
      .toArray(),
  ]);

  const config = configRaw as unknown as BudgetConfigDoc;
  const bcaBalance = bcaAccount?.balance ?? 0;
  const briKas = briKasData.briKas;
  const totalSaldo = bcaBalance + briKas;

  const actualSpending: Record<string, number> = {};
  const spendingDetails: Record<string, Entry[]> = {};
  for (const cat of config.categories) {
    actualSpending[cat.key] = 0;
    spendingDetails[cat.key] = [];
  }
  spendingDetails["lainnya"] = [];

  for (const e of personalOut) {
    const cat = e.category ?? "";
    const desc = (e.description ?? "").toLowerCase();

    if (cat === "transfer") continue;
    if (cat === "pln" || cat === "bpjs" || cat === "token" || cat === "pulsa" || cat === "internet") continue;

    let key = "lainnya";
    if (cat === "belanja" || cat === "gym") key = "belanja";
    else if (cat === "makan" || cat === "makan_minum" || cat === "qris") key = "makan_minum";
    else if (cat === "savings") key = "savings";
    else if (
      desc.includes("grab") ||
      desc.includes("gojek") ||
      desc.includes("top up") ||
      desc.includes("topup") ||
      desc.includes("shopeepay") ||
      desc.includes("ovo") ||
      desc.includes("gopay") ||
      desc.includes("dana") ||
      desc.includes("pulsa")
    ) {
      key = "lainnya";
    }

    if (actualSpending[key] !== undefined) {
      actualSpending[key] += e.amount;
      spendingDetails[key].push(serializeDates(e) as unknown as Entry);
    } else {
      actualSpending["lainnya"] += e.amount;
      spendingDetails["lainnya"].push(serializeDates(e) as unknown as Entry);
    }
  }

  let loanTotalThisMonth = 0;
  let loanPaidThisMonth = 0;
  for (const loan of loanSchedules) {
    const sched = (loan.schedule ?? []).find((s) => s.month === targetMonth);
    if (sched) {
      loanTotalThisMonth += sched.amount;
      if (sched.status === "lunas") {
        loanPaidThisMonth += sched.amount;
      }
    }
  }

  const recurringTotalThisMonth = recurring.reduce((s, r) => s + (r.amount ?? 0), 0);

  const fixedDeductionsTotal = config.fixed_deductions.reduce((s, d) => {
    if (d.type === "loan") return s + loanTotalThisMonth;
    if (d.type === "recurring") return s + recurringTotalThisMonth;
    return s + d.amount;
  }, 0);

  const netAvailable = config.monthly_income + config.bonus_income - fixedDeductionsTotal;
  const totalBudgeted = config.categories.reduce((s, cat) => s + cat.limit, 0);
  const totalRemainingBudget = config.categories.reduce(
    (s, cat) => s + Math.max(0, cat.limit - (actualSpending[cat.key] ?? 0)),
    0,
  );

  return {
    config,
    bcaBalance,
    briKas,
    totalSaldo,
    month: targetMonth,
    actualSpending,
    spendingDetails,
    loanTotalThisMonth,
    loanPaidThisMonth,
    recurringTotalThisMonth,
    fixedDeductionsTotal,
    netAvailable,
    totalBudgeted,
    totalRemainingBudget,
  };
}
