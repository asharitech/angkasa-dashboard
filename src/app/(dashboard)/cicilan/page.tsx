import { getObligations } from "@/lib/dal";
import CicilanClientPage from "./cicilan-client";

export const dynamic = "force-dynamic";

export default async function CicilanPage() {
  const loans = await getObligations({ type: "loan", status: "active" });

  const witaParts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Makassar",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(new Date());
  const witaYear = witaParts.find((p) => p.type === "year")?.value ?? "1970";
  const witaMonth = witaParts.find((p) => p.type === "month")?.value ?? "01";
  const currentMonth = `${witaYear}-${witaMonth}`;

  // Serialize for client component
  const serializedLoans = loans.map((loan) => ({
    _id: loan._id.toString(),
    item: loan.item,
    due_day: loan.due_day ?? undefined,
    schedule: (loan.schedule ?? []).map((s) => ({
      month: s.month,
      amount: s.amount,
      status: s.status,
      paid_at: s.paid_at,
    })),
  }));

  return <CicilanClientPage loans={serializedLoans} currentMonth={currentMonth} />;
}
