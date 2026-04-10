import { getObligations } from "@/lib/data";
import { formatRupiah } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { SummaryCard } from "@/components/summary-card";
import { CreditCard, Repeat, CheckCircle2, Clock, CalendarDays } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function CicilanPage() {
  const [loans, recurring] = await Promise.all([
    getObligations({ type: "loan", status: "active" }),
    getObligations({ type: "recurring", status: "active" }),
  ]);

  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  let currentTotal = 0;
  for (const loan of loans) {
    const sched = loan.schedule?.find((s) => s.month === currentMonth);
    if (sched) currentTotal += sched.amount;
  }

  const recurringTotal = recurring.reduce((s, r) => s + (r.amount ?? 0), 0);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold tracking-tight md:text-2xl flex items-center gap-2">
        <CreditCard className="h-6 w-6 text-primary" />
        Cicilan & Recurring
      </h2>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3">
        <SummaryCard
          title={`Cicilan ${currentMonth}`}
          value={formatRupiah(currentTotal)}
          icon={<CreditCard className="h-5 w-5" />}
          iconColor="text-blue-600"
          iconBg="bg-blue-50"
        />
        <SummaryCard
          title="Recurring/bulan"
          value={formatRupiah(recurringTotal)}
          icon={<Repeat className="h-5 w-5" />}
          iconColor="text-violet-600"
          iconBg="bg-violet-50"
        />
      </div>

      {/* Loan cards */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
          <CreditCard className="h-4 w-4" />
          Cicilan
        </h3>
        {loans.map((loan) => (
          <Card key={loan._id} className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-base">
                <span className="font-semibold">{loan.item}</span>
                {loan.due_day && (
                  <Badge variant="outline" className="font-medium flex items-center gap-1">
                    <CalendarDays className="h-3.5 w-3.5" />
                    Tgl {loan.due_day}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {loan.schedule?.map((s) => {
                  const isPaid = s.status === "lunas";
                  return (
                    <div
                      key={s.month}
                      className={`flex items-center justify-between rounded-lg px-4 py-3 ${
                        isPaid ? "bg-emerald-50/50" : "bg-muted/50"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        {isPaid ? (
                          <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500" />
                        ) : (
                          <Clock className="h-4.5 w-4.5 text-muted-foreground" />
                        )}
                        <span
                          className={`text-sm font-medium ${
                            isPaid ? "text-muted-foreground line-through" : ""
                          }`}
                        >
                          {s.month}
                        </span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <span className="text-sm font-semibold tabular-nums">
                          {formatRupiah(s.amount)}
                        </span>
                        <Badge
                          className={`font-medium border ${
                            isPaid
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-amber-50 text-amber-700 border-amber-200"
                          }`}
                        >
                          {s.status}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Separator />

      {/* Recurring */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
          <Repeat className="h-4 w-4" />
          Pengeluaran Rutin
        </h3>
        <Card className="shadow-sm">
          <CardContent className="divide-y divide-border/60">
            {recurring.map((r) => (
              <div
                key={r._id}
                className="flex items-center justify-between py-4 first:pt-5 last:pb-5"
              >
                <div>
                  <p className="text-sm font-semibold">{r.item}</p>
                  <Badge variant="outline" className="mt-1.5">
                    {r.category.replace(/_/g, " ")}
                  </Badge>
                </div>
                <span className="text-base font-bold tabular-nums">
                  {formatRupiah(r.amount ?? 0)}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
