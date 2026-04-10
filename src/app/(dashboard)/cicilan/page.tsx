import { getObligations } from "@/lib/data";
import { formatRupiah } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export const dynamic = "force-dynamic";

export default async function CicilanPage() {
  const [loans, recurring] = await Promise.all([
    getObligations({ type: "loan", status: "active" }),
    getObligations({ type: "recurring", status: "active" }),
  ]);

  // Next month's total
  const now = new Date();
  const nextMonth = `${now.getFullYear()}-${String(now.getMonth() + 2).padStart(2, "0")}`;
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  let currentTotal = 0;
  for (const loan of loans) {
    const sched = loan.schedule?.find((s) => s.month === currentMonth);
    if (sched) currentTotal += sched.amount;
  }

  const recurringTotal = recurring.reduce((s, r) => s + (r.amount ?? 0), 0);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold md:text-xl">Cicilan & Recurring</h2>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-3">
            <p className="text-[10px] text-muted-foreground">
              Cicilan {currentMonth}
            </p>
            <p className="text-sm font-bold tabular-nums">
              {formatRupiah(currentTotal)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <p className="text-[10px] text-muted-foreground">
              Recurring/bulan
            </p>
            <p className="text-sm font-bold tabular-nums">
              {formatRupiah(recurringTotal)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Loan cards */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground">Cicilan</h3>
        {loans.map((loan) => (
          <Card key={loan._id}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-sm">
                <span>{loan.item}</span>
                {loan.due_day && (
                  <Badge variant="outline" className="text-[10px]">
                    Jatuh tempo tgl {loan.due_day}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1.5">
                {loan.schedule?.map((s) => (
                  <div
                    key={s.month}
                    className="flex items-center justify-between text-xs"
                  >
                    <span
                      className={
                        s.status === "lunas" ? "text-muted-foreground line-through" : ""
                      }
                    >
                      {s.month}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="tabular-nums">
                        {formatRupiah(s.amount)}
                      </span>
                      <Badge
                        variant={s.status === "lunas" ? "secondary" : "outline"}
                        className="text-[9px] px-1"
                      >
                        {s.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Separator />

      {/* Recurring */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground">
          Pengeluaran Rutin
        </h3>
        <Card>
          <CardContent className="divide-y">
            {recurring.map((r) => (
              <div
                key={r._id}
                className="flex items-center justify-between py-2.5 first:pt-4 last:pb-4"
              >
                <div>
                  <p className="text-xs font-medium">{r.item}</p>
                  <Badge variant="outline" className="text-[9px] px-1 mt-0.5">
                    {r.category.replace(/_/g, " ")}
                  </Badge>
                </div>
                <span className="text-xs font-semibold tabular-nums">
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
