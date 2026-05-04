import { getObligations } from "@/lib/data";
import { formatRupiah } from "@/lib/format";
import { idString } from "@/lib/utils";
import { SectionCard } from "@/components/section-card";
import { CreditCard, CalendarDays, CheckCircle2, Clock, Repeat } from "lucide-react";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function CicilanPage() {
  const loans = await getObligations({ type: "loan", status: "active" });
  const recurring = await getObligations({ type: "recurring", status: "active" });

  // Filter recurring to personal-scale items (exclude yayasan-scale)
  const rutin = recurring.filter(
    (r) =>
      r.category !== "wajib_bulanan_yayasan" &&
      (r.amount ?? 0) < 50_000_000
  );

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

  const totalRutin = rutin.reduce((s, r) => s + (r.amount ?? 0), 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-bold tracking-tight md:text-2xl flex items-center gap-2">
          <CreditCard className="h-6 w-6 text-primary shrink-0" />
          Cicilan & Pengeluaran Rutin
        </h2>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3">
        <SectionCard title="Cicilan Bulan Ini" tone="warning" bodyClassName="py-3">
          <p className="text-2xl font-extrabold tabular-nums text-destructive">
            {formatRupiah(cicilanBulanIni)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">{currentMonth}</p>
        </SectionCard>
        <SectionCard title="Rutin Bulanan" tone="info" bodyClassName="py-3">
          <p className="text-2xl font-extrabold tabular-nums text-primary">
            {formatRupiah(totalRutin)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">{rutin.length} item rutin</p>
        </SectionCard>
      </div>

      {/* Cicilan List */}
      <SectionCard title="Cicilan Aktif" tone="primary">
        {loans.length === 0 ? (
          <p className="text-center text-muted-foreground py-4 text-sm">Tidak ada cicilan aktif.</p>
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
                <div key={idString(loan._id)} className="space-y-2 pb-3 border-b border-border/30 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm">{loan.item}</span>
                    <span className="text-sm font-bold tabular-nums">{formatRupiah(remainingAmount)}</span>
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
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <CalendarDays className="h-3 w-3" />
                      Lunas {lastMonth}
                      {loan.due_day && <> · Tgl {loan.due_day}</>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>

      {/* Rutin List */}
      <SectionCard title="Pengeluaran Rutin Bulanan" tone="info">
        {rutin.length === 0 ? (
          <p className="text-center text-muted-foreground py-4 text-sm">Tidak ada pengeluaran rutin.</p>
        ) : (
          <div className="divide-y divide-border/50">
            {rutin.map((item) => (
              <div key={idString(item._id)} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold truncate">{item.item}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {item.category?.replace(/_/g, " ")}
                    {item.due_day && <> · Tgl {item.due_day}</>}
                  </p>
                </div>
                <span className="text-sm font-bold tabular-nums shrink-0 text-destructive">
                  {formatRupiah(item.amount ?? 0)}
                </span>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
