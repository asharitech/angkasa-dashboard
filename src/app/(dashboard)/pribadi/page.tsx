import { getPengeluaranAngkasa, getAccounts } from "@/lib/dal";
import { DashboardPageShell } from "@/components/layout/dashboard-page-shell";
import { PribadiClient } from "./pribadi-client";

export const dynamic = "force-dynamic";

export default async function PribadiPage({
  searchParams,
}: {
  searchParams: Promise<{ bulan?: string; label?: string }>;
}) {
  const params = await searchParams;
  const bulanParam =
    params.bulan && /^\d{4}-\d{2}$/.test(params.bulan) ? params.bulan : undefined;

  let data = await getPengeluaranAngkasa(bulanParam);
  const activeMonth =
    bulanParam && data.months.includes(bulanParam)
      ? bulanParam
      : (data.months[0] ?? "");

  const mustRescopeToActive =
    Boolean(activeMonth) &&
    ((bulanParam != null && activeMonth !== bulanParam) ||
      (bulanParam == null && activeMonth !== ""));
  if (mustRescopeToActive) {
    data = await getPengeluaranAngkasa(activeMonth);
  }

  const accounts = await getAccounts();

  return (
    <DashboardPageShell maxWidth="narrow" className="py-4 md:py-2">
      <PribadiClient
        entries={data.entries}
        entriesOut={data.entriesOut}
        months={data.months}
        cashflowByMonth={data.cashflowByMonth as Record<string, { in: number; out: number }>}
        activeMonth={activeMonth}
        activeLabel={params.label as "makan_minum" | "grab_gojek" | "belanja" | "top_up" | "pulsa" | "lainnya" | undefined}
        accounts={accounts}
      />
    </DashboardPageShell>
  );
}
