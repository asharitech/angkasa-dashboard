import { getPribadiSummary } from "@/lib/data";
import type { Obligation } from "@/lib/types";
import { formatRupiah, formatDateShort } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { KpiStrip, type KpiItem } from "@/components/kpi-strip";
import { SectionCard } from "@/components/section-card";
import { EmptyState } from "@/components/empty-state";
import { FilterTabs, type FilterTab } from "@/components/filter-bar";
import { TransactionIcon, AmountText } from "@/components/transaction-item";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
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
  Inbox,
} from "lucide-react";

export const dynamic = "force-dynamic";

const VIEWS = ["ringkasan", "akun", "cicilan", "numpang", "pengeluaran"] as const;
type View = (typeof VIEWS)[number];

const VIEW_LABEL: Record<View, string> = {
  ringkasan: "Ringkasan",
  akun: "Akun",
  cicilan: "Cicilan & Piutang",
  numpang: "Numpang",
  pengeluaran: "Pengeluaran",
};

export default async function PribadiPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const { view } = await searchParams;
  const activeView: View = (VIEWS as readonly string[]).includes(view ?? "")
    ? (view as View)
    : "ringkasan";

  const data = await getPribadiSummary();

  const bcaAccount = data.personalAccounts.find((a) => a._id === "bca_angkasa");
  const briAccount = data.personalAccounts.find((a) => a._id === "bri_angkasa");
  const bcaBalance = bcaAccount?.balance ?? 0;
  const briEstatement = briAccount?.balance ?? 0;
  const numpangTotal = data.numpang.reduce((s, n) => s + n.amount, 0);
  const briKas = briEstatement - numpangTotal;
  const cashTotal = bcaBalance + briKas;
  const piutangTotal = data.piutangByMonth.reduce((s, p) => s + p.total, 0);

  const totalSavings = data.savingsTotal.reduce((s, r) => {
    return s + (r.total_out > 0 ? r.total_out : r.total_in > 0 ? r.total_in : r.total);
  }, 0);

  const witaParts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Makassar",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(new Date());
  const witaYear = witaParts.find((p) => p.type === "year")?.value ?? "1970";
  const witaMonth = witaParts.find((p) => p.type === "month")?.value ?? "01";
  const currentMonth = `${witaYear}-${witaMonth}`;
  let cicilanBulanIni = 0;
  let totalRemainingDebt = 0;
  for (const loan of data.loans) {
    for (const s of loan.schedule ?? []) {
      if (s.status !== "lunas") totalRemainingDebt += s.amount;
      if (s.month === currentMonth) cicilanBulanIni += s.amount;
    }
  }
  const recurringTotal = data.recurring.reduce((s, r) => s + (r.amount ?? 0), 0);
  const netPosition = cashTotal + piutangTotal - totalRemainingDebt;
  const totalBulanan = cicilanBulanIni + recurringTotal;

  const kpis: KpiItem[] = [
    {
      label: "Posisi Bersih",
      value: formatRupiah(netPosition),
      icon: Target,
      tone: netPosition >= 0 ? "info" : "danger",
      hint: "Kas + piutang − hutang",
      valueTone: netPosition >= 0 ? undefined : "danger",
    },
    {
      label: "Cash Total",
      value: formatRupiah(cashTotal),
      icon: Wallet,
      tone: "primary",
      hint: `BCA ${formatRupiah(bcaBalance)} · BRI ${formatRupiah(briKas)}`,
    },
    {
      label: "Piutang",
      value: formatRupiah(piutangTotal),
      icon: HandCoins,
      tone: "warning",
      hint: "Belum diganti yayasan",
    },
    {
      label: "Sisa Cicilan",
      value: formatRupiah(totalRemainingDebt),
      icon: TrendingDown,
      tone: "danger",
      hint: `${data.loans.length} cicilan aktif`,
      valueTone: "danger",
    },
  ];

  const viewTabs: FilterTab[] = VIEWS.map((v) => ({
    label: VIEW_LABEL[v],
    href: v === "ringkasan" ? "/pribadi" : `/pribadi?view=${v}`,
    active: v === activeView,
  }));

  return (
    <div className="space-y-5">
      <PageHeader icon={User} title="Keuangan Pribadi">
        {briAccount?.balance_as_of && (
          <span className="text-xs text-muted-foreground">
            BRI per {formatDateShort(briAccount.balance_as_of)}
          </span>
        )}
      </PageHeader>

      <KpiStrip items={kpis} cols={4} />

      <FilterTabs tabs={viewTabs} />

      {activeView === "ringkasan" && (
        <RingkasanView
          currentMonth={currentMonth}
          cicilanBulanIni={cicilanBulanIni}
          recurringTotal={recurringTotal}
          totalBulanan={totalBulanan}
          totalSavings={totalSavings}
          savingsTotal={data.savingsTotal}
          savings={data.savings}
        />
      )}

      {activeView === "akun" && <AkunView accounts={data.personalAccounts} />}

      {activeView === "cicilan" && (
        <CicilanView
          loans={data.loans}
          totalRemainingDebt={totalRemainingDebt}
          piutangByMonth={data.piutangByMonth}
          piutangTotal={piutangTotal}
        />
      )}

      {activeView === "numpang" && (
        <NumpangView numpang={data.numpang} numpangTotal={numpangTotal} />
      )}

      {activeView === "pengeluaran" && (
        <PengeluaranView recurring={data.recurring} recurringTotal={recurringTotal} spending={data.spending} />
      )}
    </div>
  );
}

type SavingsAggregate = { _id: string; count: number; total: number; total_in: number; total_out: number };
type SavingEntry = { _id: string; description: string; date: string; owner: string; amount: number };

function RingkasanView({
  currentMonth,
  cicilanBulanIni,
  recurringTotal,
  totalBulanan,
  totalSavings,
  savingsTotal,
  savings,
}: {
  currentMonth: string;
  cicilanBulanIni: number;
  recurringTotal: number;
  totalBulanan: number;
  totalSavings: number;
  savingsTotal: SavingsAggregate[];
  savings: SavingEntry[];
}) {
  return (
    <div className="space-y-4">
      <SectionCard
        icon={CalendarDays}
        title="Proyeksi Bulanan"
        tone="danger"
        badge={
          <span className="ml-1 text-sm font-bold tabular-nums text-rose-600">
            {formatRupiah(totalBulanan)}/bln
          </span>
        }
      >
        <div className="space-y-1.5">
          <KvRow label={`Cicilan (${currentMonth})`} value={cicilanBulanIni} />
          <KvRow label="Pengeluaran Rutin" value={recurringTotal} />
          <KvRow label="Total Kewajiban/Bulan" value={totalBulanan} highlight />
        </div>
      </SectionCard>

      {savingsTotal.length > 0 && (
        <SectionCard
          icon={PiggyBank}
          title="Tabungan"
          tone="info"
          badge={
            <span className="ml-1 text-sm font-bold tabular-nums text-violet-700">
              {formatRupiah(totalSavings)}
            </span>
          }
        >
          <div className="space-y-1.5">
            {savingsTotal.map((s) => {
              const displayAmount =
                s.total_out > 0 ? s.total_out : s.total_in > 0 ? s.total_in : s.total;
              return (
                <div
                  key={s._id}
                  className="flex items-center justify-between rounded-md bg-violet-50/50 px-3 py-2"
                >
                  <div>
                    <span className="text-sm font-medium capitalize">{s._id}</span>
                    <span className="ml-2 text-xs text-muted-foreground">{s.count} setoran</span>
                  </div>
                  <span className="text-sm font-semibold tabular-nums">
                    {formatRupiah(displayAmount)}
                  </span>
                </div>
              );
            })}
          </div>
          {savings.length > 0 && (
            <>
              <p className="mt-3 px-1 pb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Riwayat Terakhir
              </p>
              <div className="space-y-0.5">
                {savings.slice(0, 8).map((entry) => (
                  <div
                    key={entry._id}
                    className="flex items-center justify-between rounded-md px-2 py-1.5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm">{entry.description}</p>
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
            </>
          )}
        </SectionCard>
      )}
    </div>
  );
}

function AkunView({
  accounts,
}: {
  accounts: { _id: string; bank: string; holder: string; balance: number; balance_as_of?: string }[];
}) {
  return (
    <SectionCard icon={Wallet} title="Rekening Pribadi" tone="info">
      <div className="space-y-1.5">
        {accounts.map((acc) => (
          <div
            key={acc._id}
            className="flex items-center justify-between rounded-md bg-muted/40 px-3 py-2.5"
          >
            <div className="min-w-0">
              <p className="text-sm font-semibold">{acc.bank}</p>
              <p className="truncate text-xs text-muted-foreground">
                {acc.holder}
                {acc.balance_as_of && <> · per {formatDateShort(acc.balance_as_of)}</>}
              </p>
            </div>
            <p className="text-sm font-bold tabular-nums">{formatRupiah(acc.balance)}</p>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

function CicilanView({
  loans,
  totalRemainingDebt,
  piutangByMonth,
  piutangTotal,
}: {
  loans: Obligation[];
  totalRemainingDebt: number;
  piutangByMonth: { _id: string | null; count: number; total: number }[];
  piutangTotal: number;
}) {
  return (
    <div className="space-y-4">
      {loans.length > 0 ? (
        <SectionCard
          icon={CreditCard}
          title="Cicilan"
          tone="danger"
          badge={
            <span className="ml-1 text-sm font-bold tabular-nums text-rose-600">
              sisa {formatRupiah(totalRemainingDebt)}
            </span>
          }
        >
          <div className="space-y-4">
            {loans.map((loan) => {
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
                      <Badge variant="outline" className="flex items-center gap-1 text-xs">
                        <CalendarDays className="h-3 w-3" />
                        Tgl {loan.due_day}
                      </Badge>
                    )}
                  </div>
                  <div className="px-1 text-xs text-muted-foreground">
                    Sisa: {formatRupiah(remainingAmount)} · {remaining.length} bulan lagi
                  </div>
                  <div className="space-y-1">
                    {paid.length > 0 && (
                      <div className="flex items-center justify-between rounded-md bg-emerald-50/60 px-3 py-2">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                          <span className="text-sm text-muted-foreground">
                            {paid.length} bulan lunas
                          </span>
                        </div>
                        <span className="text-sm tabular-nums text-muted-foreground">
                          {formatRupiah(paid.reduce((s, p) => s + p.amount, 0))}
                        </span>
                      </div>
                    )}
                    {remaining.map((s) => (
                      <div
                        key={s.month}
                        className="flex items-center justify-between rounded-md bg-muted/40 px-3 py-2"
                      >
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">{s.month}</span>
                        </div>
                        <span className="text-sm font-semibold tabular-nums">
                          {formatRupiah(s.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </SectionCard>
      ) : (
        <EmptyState icon={Inbox} title="Tidak ada cicilan aktif" />
      )}

      {piutangByMonth.length > 0 && (
        <SectionCard
          icon={HandCoins}
          title="Hutang Yayasan ke Saya"
          tone="warning"
          badge={
            <span className="ml-1 text-sm font-bold tabular-nums text-amber-700">
              {formatRupiah(piutangTotal)}
            </span>
          }
        >
          <div className="space-y-1.5">
            {piutangByMonth.map((p) => (
              <div
                key={p._id ?? "lain"}
                className="flex items-center justify-between rounded-md bg-amber-50/50 px-3 py-2"
              >
                <div>
                  <span className="text-sm font-medium">{p._id ?? "Lainnya"}</span>
                  <span className="ml-2 text-xs text-muted-foreground">{p.count} item</span>
                </div>
                <span className="text-sm font-semibold tabular-nums">{formatRupiah(p.total)}</span>
              </div>
            ))}
          </div>
        </SectionCard>
      )}
    </div>
  );
}

function NumpangView({
  numpang,
  numpangTotal,
}: {
  numpang: { _id: string; description?: string; amount: number }[];
  numpangTotal: number;
}) {
  if (numpangTotal === 0) {
    return (
      <EmptyState
        icon={Inbox}
        title="Tidak ada dana numpang"
        description="Saat ini tidak ada dana parkir di rekening pribadi."
      />
    );
  }
  return (
    <SectionCard
      icon={Banknote}
      title="Dana Numpang di BRI"
      tone="muted"
      badge={
        <span className="ml-1 text-sm font-bold tabular-nums text-muted-foreground">
          {formatRupiah(numpangTotal)}
        </span>
      }
    >
      <div className="space-y-1.5">
        {numpang.map((n) => (
          <div
            key={n._id}
            className="flex items-center justify-between rounded-md bg-muted/40 px-3 py-2"
          >
            <div>
              <span className="text-sm capitalize">{n._id.replace(/_/g, " ")}</span>
              {n.description && n.description !== n._id && (
                <p className="text-xs text-muted-foreground">{n.description}</p>
              )}
            </div>
            <span className="text-sm font-semibold tabular-nums">{formatRupiah(n.amount)}</span>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

type SpendEntry = {
  _id: string;
  description: string;
  date: string;
  amount: number;
  direction: "in" | "out";
  category?: string;
};

function PengeluaranView({
  recurring,
  recurringTotal,
  spending,
}: {
  recurring: Obligation[];
  recurringTotal: number;
  spending: SpendEntry[];
}) {
  return (
    <div className="space-y-4">
      {recurring.length > 0 && (
        <SectionCard
          icon={Repeat}
          title="Pengeluaran Rutin"
          tone="info"
          badge={
            <span className="ml-1 text-sm font-bold tabular-nums text-muted-foreground">
              {formatRupiah(recurringTotal)}/bln
            </span>
          }
        >
          <div className="space-y-1.5">
            {recurring.map((r) => (
              <div
                key={r._id}
                className="flex items-center justify-between rounded-md bg-muted/40 px-3 py-2"
              >
                <div>
                  <p className="text-sm font-semibold">{r.item}</p>
                  <Badge variant="outline" className="mt-1">
                    {r.category.replace(/_/g, " ")}
                  </Badge>
                </div>
                <span className="text-sm font-bold tabular-nums">
                  {formatRupiah(r.amount ?? 0)}
                </span>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {spending.length > 0 ? (
        <SectionCard icon={ShoppingBag} title="Pengeluaran Terakhir" tone="muted">
          <ul className="divide-y divide-border/40">
            {spending.slice(0, 25).map((entry) => (
              <li key={entry._id} className="flex items-center justify-between py-2.5">
                <div className="flex min-w-0 items-center gap-3">
                  <TransactionIcon direction={entry.direction} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{entry.description}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {formatDateShort(entry.date)}
                      {entry.category && <> · {entry.category.replace(/_/g, " ")}</>}
                    </p>
                  </div>
                </div>
                <AmountText
                  amount={entry.amount}
                  direction={entry.direction}
                  formatter={formatRupiah}
                />
              </li>
            ))}
          </ul>
        </SectionCard>
      ) : (
        <EmptyState icon={Inbox} title="Belum ada pengeluaran" />
      )}
    </div>
  );
}

function KvRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between rounded-md px-3 py-2",
        highlight ? "border border-primary/10 bg-primary/5" : "bg-muted/40",
      )}
    >
      <span className={cn("text-sm", highlight && "font-semibold")}>{label}</span>
      <span
        className={cn(
          "text-sm font-semibold tabular-nums",
          highlight && "text-base font-bold text-primary",
        )}
      >
        {formatRupiah(value)}
      </span>
    </div>
  );
}

void Card;
void CardContent;
