import { getPribadiSummary } from "@/lib/data";
import { formatRupiah, formatDateShort } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SummaryCard } from "@/components/summary-card";
import { PageHeader } from "@/components/page-header";
import { TransactionIcon, AmountText } from "@/components/transaction-item";
import { StatusBadge } from "@/components/status-badge";
import {
  User,
  Wallet,
  HandCoins,
  PiggyBank,
  CreditCard,
  Repeat,
  Banknote,
  CheckCircle2,
  Clock,
  CalendarDays,
  ShoppingBag,
  TrendingDown,
  Target,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function PribadiPage() {
  const data = await getPribadiSummary();

  const bal = data.balance?.balance;
  // Prefer live account balances over the cached balance ledger
  const bcaAccount = data.personalAccounts.find((a) => a._id === "bca_angkasa");
  const briKas = bal?.cash?.bri_kas ?? 0; // BRI kas is calculated (LUNAS ANGKASA), not from e-statement
  const bcaBalance = bcaAccount?.balance ?? bal?.cash?.bca ?? 0;
  const cashTotal = bcaBalance + briKas;
  const numpang = bal?.numpang ?? {};
  const numpangTotal = numpang.total ?? 0;

  // Piutang from live pengajuan
  const piutangTotal = data.piutangByMonth.reduce((s, p) => s + p.total, 0);

  // Savings total — angkasa records as out (spending from his account), eba as in
  const totalSavings = data.savingsTotal.reduce((s, r) => {
    // Use directional totals: angkasa saves = out, eba saves = in
    return s + (r.total_out > 0 ? r.total_out : r.total_in > 0 ? r.total_in : r.total);
  }, 0);

  // Cicilan current month + remaining debt
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  let cicilanBulanIni = 0;
  let paidCount = 0;
  let totalScheduled = 0;
  let totalRemainingDebt = 0;

  for (const loan of data.loans) {
    for (const s of loan.schedule ?? []) {
      if (s.status !== "lunas") totalRemainingDebt += s.amount;
      if (s.month === currentMonth) {
        totalScheduled++;
        cicilanBulanIni += s.amount;
        if (s.status === "lunas") paidCount++;
      }
    }
  }

  const recurringTotal = data.recurring.reduce((s, r) => s + (r.amount ?? 0), 0);

  // Net position = kas + piutang - remaining debt
  const netPosition = cashTotal + piutangTotal - totalRemainingDebt;

  // Monthly projection: total outflow this month
  const totalBulanan = cicilanBulanIni + recurringTotal;

  return (
    <div className="space-y-6">
      <PageHeader icon={User} title="Keuangan Pribadi">
        {data.balance?.as_of && (
          <span className="text-xs text-muted-foreground">
            per {formatDateShort(data.balance.as_of)}
          </span>
        )}
      </PageHeader>

      {/* Top summary */}
      <div className="grid grid-cols-2 gap-3">
        <SummaryCard
          title="BCA"
          value={formatRupiah(bcaBalance)}
          subtitle={bcaAccount?.balance_as_of ? `per ${formatDateShort(bcaAccount.balance_as_of)}` : "murni"}
          icon={<Wallet className="h-5 w-5" />}
          iconColor="text-blue-600"
          iconBg="bg-blue-50"
        />
        <SummaryCard
          title="BRI Kas"
          value={formatRupiah(briKas)}
          subtitle="dari Lembar2"
          icon={<Banknote className="h-5 w-5" />}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50"
        />
        <SummaryCard
          title="Piutang"
          value={formatRupiah(piutangTotal)}
          subtitle="Belum diganti yayasan"
          icon={<HandCoins className="h-5 w-5" />}
          iconColor="text-amber-600"
          iconBg="bg-amber-50"
        />
        <SummaryCard
          title="Sisa Cicilan"
          value={formatRupiah(totalRemainingDebt)}
          subtitle={`${data.loans.length} cicilan aktif`}
          icon={<TrendingDown className="h-5 w-5" />}
          iconColor="text-rose-600"
          iconBg="bg-rose-50"
          valueColor="text-rose-600"
        />
        <SummaryCard
          title="Posisi Bersih"
          value={formatRupiah(netPosition)}
          subtitle="Kas + piutang − hutang"
          icon={<Target className="h-5 w-5" />}
          iconColor={netPosition >= 0 ? "text-blue-600" : "text-rose-600"}
          iconBg={netPosition >= 0 ? "bg-blue-50" : "bg-rose-50"}
          valueColor={netPosition >= 0 ? undefined : "text-rose-600"}
        />
      </div>

      {/* Monthly projection */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-muted-foreground" />
            Proyeksi Bulanan
            <span className="ml-auto text-sm font-bold tabular-nums text-rose-600">
              {formatRupiah(totalBulanan)}/bln
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between items-center rounded-lg bg-muted/50 px-4 py-3">
            <span className="text-sm">Cicilan ({currentMonth})</span>
            <span className="text-sm font-semibold tabular-nums">{formatRupiah(cicilanBulanIni)}</span>
          </div>
          <div className="flex justify-between items-center rounded-lg bg-muted/50 px-4 py-3">
            <span className="text-sm">Pengeluaran Rutin</span>
            <span className="text-sm font-semibold tabular-nums">{formatRupiah(recurringTotal)}</span>
          </div>
          <div className="flex justify-between items-center rounded-lg bg-primary/5 px-4 py-3.5 border border-primary/10">
            <span className="text-sm font-semibold">Total Kewajiban/Bulan</span>
            <span className="text-base font-bold tabular-nums text-primary">{formatRupiah(totalBulanan)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Personal accounts */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Wallet className="h-5 w-5 text-muted-foreground" />
            Rekening Pribadi
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {data.personalAccounts.map((acc) => (
            <div
              key={acc._id}
              className="flex items-center justify-between rounded-xl bg-muted/50 p-4"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold">{acc.bank}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {acc.holder}
                  {acc.balance_as_of && (
                    <> · per {formatDateShort(acc.balance_as_of)}</>
                  )}
                </p>
              </div>
              <p className="text-base font-bold tabular-nums">
                {formatRupiah(acc.balance)}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Tabungan */}
      {data.savingsTotal.length > 0 && (
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <PiggyBank className="h-5 w-5 text-muted-foreground" />
              Tabungan
              <span className="ml-auto text-sm font-bold tabular-nums text-violet-700">
                {formatRupiah(totalSavings)}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.savingsTotal.map((s) => {
              const displayAmount = s.total_out > 0 ? s.total_out : s.total_in > 0 ? s.total_in : s.total;
              return (
                <div key={s._id} className="flex justify-between items-center rounded-lg bg-violet-50/50 px-4 py-3">
                  <div>
                    <span className="text-sm font-medium capitalize">{s._id}</span>
                    <span className="text-xs text-muted-foreground ml-2">{s.count} setoran</span>
                  </div>
                  <span className="text-sm font-semibold tabular-nums">
                    {formatRupiah(displayAmount)}
                  </span>
                </div>
              );
            })}
            {/* Recent savings entries inline */}
            {data.savings.length > 0 && (
              <div className="pt-2 space-y-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1 pb-1">
                  Riwayat Terakhir
                </p>
                {data.savings.slice(0, 10).map((entry) => (
                  <div
                    key={entry._id}
                    className="flex items-center justify-between rounded-lg px-2 py-2"
                  >
                    <div className="min-w-0">
                      <p className="text-sm truncate">{entry.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDateShort(entry.date)} · {entry.owner}
                      </p>
                    </div>
                    <span className="text-sm font-semibold tabular-nums text-violet-600">
                      {formatRupiah(entry.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Dana Numpang */}
      {numpangTotal > 0 && (
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Banknote className="h-5 w-5 text-muted-foreground" />
              Dana Numpang di BRI
              <span className="ml-auto text-sm font-bold tabular-nums text-muted-foreground">
                {formatRupiah(numpangTotal)}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(numpang)
              .filter(([k]) => k !== "total")
              .map(([key, val]) => (
                <div key={key} className="flex justify-between items-center rounded-lg bg-muted/50 px-4 py-3">
                  <span className="text-sm capitalize">{key.replace(/_/g, " ")}</span>
                  <span className="text-sm font-semibold tabular-nums">{formatRupiah(val as number)}</span>
                </div>
              ))}
          </CardContent>
        </Card>
      )}

      {/* Piutang breakdown */}
      {data.piutangByMonth.length > 0 && (
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <HandCoins className="h-5 w-5 text-muted-foreground" />
              Hutang Yayasan ke Saya
              <span className="ml-auto text-sm font-bold tabular-nums text-amber-700">
                {formatRupiah(piutangTotal)}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.piutangByMonth.map((p) => (
              <div key={p._id} className="flex justify-between items-center rounded-lg bg-amber-50/50 px-4 py-3">
                <div>
                  <span className="text-sm font-medium">{p._id ?? "Lainnya"}</span>
                  <span className="text-xs text-muted-foreground ml-2">{p.count} item</span>
                </div>
                <span className="text-sm font-semibold tabular-nums">
                  {formatRupiah(p.total)}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Cicilan with milestones */}
      {data.loans.length > 0 && (
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-muted-foreground" />
              Cicilan
              <span className="ml-auto text-sm font-bold tabular-nums text-rose-600">
                sisa {formatRupiah(totalRemainingDebt)}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.loans.map((loan) => {
              const schedule = loan.schedule ?? [];
              const paid = schedule.filter((s) => s.status === "lunas");
              const remaining = schedule.filter((s) => s.status !== "lunas");
              const lastMonth = loan.final_month ?? remaining[remaining.length - 1]?.month;
              const remainingAmount = remaining.reduce((s, r) => s + r.amount, 0);
              return (
                <div key={loan._id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">{loan.item}</span>
                      {lastMonth && (
                        <Badge variant="outline" className="text-xs">
                          lunas {lastMonth}
                        </Badge>
                      )}
                    </div>
                    {loan.due_day && (
                      <Badge variant="outline" className="text-xs flex items-center gap-1">
                        <CalendarDays className="h-3 w-3" />
                        Tgl {loan.due_day}
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground px-1">
                    Sisa: {formatRupiah(remainingAmount)} · {remaining.length} bulan lagi
                  </div>
                  <div className="space-y-1.5">
                    {/* Collapsed paid summary */}
                    {paid.length > 0 && (
                      <div className="flex items-center justify-between rounded-lg bg-emerald-50/50 px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                          <span className="text-sm text-muted-foreground">
                            {paid.length} bulan lunas
                          </span>
                        </div>
                        <span className="text-sm text-muted-foreground tabular-nums">
                          {formatRupiah(paid.reduce((s, p) => s + p.amount, 0))}
                        </span>
                      </div>
                    )}
                    {/* Remaining months */}
                    {remaining.map((s) => (
                      <div
                        key={s.month}
                        className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-2.5"
                      >
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">{s.month}</span>
                        </div>
                        <span className="text-sm font-semibold tabular-nums">{formatRupiah(s.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Recurring */}
      {data.recurring.length > 0 && (
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Repeat className="h-5 w-5 text-muted-foreground" />
              Pengeluaran Rutin
              <span className="ml-auto text-sm font-bold tabular-nums text-muted-foreground">
                {formatRupiah(recurringTotal)}/bln
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.recurring.map((r) => (
              <div key={r._id} className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold">{r.item}</p>
                  <Badge variant="outline" className="mt-1">
                    {r.category.replace(/_/g, " ")}
                  </Badge>
                </div>
                <span className="text-sm font-bold tabular-nums">{formatRupiah(r.amount ?? 0)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Recent personal spending */}
      {data.spending.length > 0 && (
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-muted-foreground" />
              Pengeluaran Terakhir
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {data.spending.slice(0, 20).map((entry) => (
                <div
                  key={entry._id}
                  className="flex items-center justify-between rounded-lg px-2 py-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <TransactionIcon direction={entry.direction} />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">{entry.description}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatDateShort(entry.date)} · {entry.category?.replace(/_/g, " ")}
                      </p>
                    </div>
                  </div>
                  <AmountText
                    amount={entry.amount}
                    direction={entry.direction}
                    formatter={formatRupiah}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
