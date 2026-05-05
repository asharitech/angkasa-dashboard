import { getBudgetSummary, getPengeluaranAngkasa } from "@/lib/data";
import { recentMonths, currentWitaMonth } from "@/lib/periods";
import AnggaranClientPage from "./anggaran-client";

export const dynamic = "force-dynamic";

export default async function AnggaranPage({
  searchParams,
}: {
  searchParams: Promise<{ bulan?: string }>;
}) {
  const params = await searchParams;
  const month = params.bulan ?? currentWitaMonth();

  const [budgetData, pengeluaranData] = await Promise.all([
    getBudgetSummary(month),
    getPengeluaranAngkasa(month),
  ]);

  const months = recentMonths(6);
  if (!months.includes(month)) months.push(month);
  months.sort().reverse();

  // Serialize dates for client component
  const serializedConfig = {
    monthly_income: budgetData.config.monthly_income ?? 10_000_000,
    bonus_income: budgetData.config.bonus_income ?? 0,
    fixed_deductions: (budgetData.config.fixed_deductions ?? []).map((d) => ({
      name: d.name,
      amount: d.amount,
      type: (d.type ?? "custom") as "loan" | "recurring" | "custom",
    })),
    categories: (budgetData.config.categories ?? []).map((c) => ({
      key: c.key,
      name: c.name,
      limit: c.limit,
      color: c.color ?? "#6b7280",
    })),
    month: month,
  };

  return (
    <AnggaranClientPage
      config={serializedConfig}
      bcaBalance={budgetData.bcaBalance}
      briKas={budgetData.briKas}
      totalSaldo={budgetData.totalSaldo}
      month={budgetData.month}
      actualSpending={budgetData.actualSpending}
      spendingDetails={budgetData.spendingDetails}
      loanTotalThisMonth={budgetData.loanTotalThisMonth}
      loanPaidThisMonth={budgetData.loanPaidThisMonth}
      recurringTotalThisMonth={budgetData.recurringTotalThisMonth}
      fixedDeductionsTotal={budgetData.fixedDeductionsTotal}
      netAvailable={budgetData.netAvailable}
      totalBudgeted={budgetData.totalBudgeted}
      totalRemainingBudget={budgetData.totalRemainingBudget}
      months={months}
    />
  );
}
