import { getObligations } from "@/lib/data";
import { formatRupiah } from "@/lib/format";
import { idString } from "@/lib/utils";
import { SectionCard } from "@/components/section-card";
import { CreditCard, CalendarDays, CheckCircle2, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

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

  let cicilanBulanIni = 0;
  let totalRemaining = 0;

  for (const loan of loans) {
    for (const s of loan.schedule ?? []) {
      if (s.status !== "lunas") totalRemaining += s.amount;
      if (s.month === currentMonth) cicilanBulanIni += s.amount;
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-bold tracking-tight md:text-2xl flex items-center gap-2">
          <CreditCard className="h-6 w-6 text-primary shrink-0" />
          Cicilan Bulanan
        </h2>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3">
        <SectionCard title="Bulan Ini" tone="warning" bodyClassName="py-3">
          <p className="text-2xl font-extrabold tabular-nums text-destructive">
            {formatRupiah(cicilanBulanIni)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">{currentMonth}</p>
        </SectionCard>
        <SectionCard title="Sisa Total" tone="danger" bodyClassName="py-3">
          <p className="text-2xl font-extrabold tabular-nums text-destructive">
            {formatRupiah(totalRemaining)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Semua cicilan aktif</p>
        </SectionCard>
      </div>

      {/* List */}
      {loans.length === 0 ? (
        <p className="text-center text-muted-foreground py-8 text-sm">Tidak ada cicilan aktif.</p>
      ) : (
        <div className="space-y-4">
          {loans.map((loan) => {
            const schedule = loan.schedule ?? [];
            const paid = schedule.filter((s) => s.status === "lunas");
            const remaining = schedule.filter((s) => s.status !== "lunas");
            const remainingAmount = remaining.reduce((s, r) => s + r.amount, 0);
            const lastMonth = loan.final_month ?? remaining[remaining.length - 1]?.month;
            const progress = schedule.length > 0 ? (paid.length / schedule.length) * 100 : 0;

            return (
              <SectionCard key={idString(loan._id)} title={loan.item} tone="primary">
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Sisa bayar</span>
                    <span className="font-bold tabular-nums">{formatRupiah(remainingAmount)}</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3 text-success" />
                      {paid.length} lunas
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-warning" />
                      {remaining.length} lagi
                    </div>
                  </div>
                  {lastMonth && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground pt-1 border-t border-border/40">
                      <CalendarDays className="h-3 w-3" />
                      Lunas {lastMonth}
                      {loan.due_day && <> · Tgl {loan.due_day}</>}
                    </div>
                  )}
                </div>
              </SectionCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
