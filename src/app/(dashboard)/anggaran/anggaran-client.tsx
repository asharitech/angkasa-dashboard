"use client";

import { useState, useTransition } from "react";
import { formatRupiah, formatRupiahCompact, formatDateShort, formatMonthCodeLong } from "@/lib/format";
import { updateBudgetAction, addBonusIncomeAction, resetBonusAction } from "@/lib/actions/budget";
import { updateAccountBalanceAction } from "@/lib/actions/accounts";
import { SectionCard } from "@/components/section-card";
import { Badge } from "@/components/ui/badge";
import {
  Wallet,
  Landmark,
  CreditCard,
  PiggyBank,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Target,
  Plus,
  RotateCcw,
  Edit2,
  Save,
  X,
  Banknote,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface BudgetCategory {
  key: string;
  name: string;
  limit: number;
  color: string;
}

interface BudgetFixedDeduction {
  name: string;
  amount: number;
  type: "loan" | "recurring" | "custom";
}

interface BudgetSummaryProps {
  config: {
    monthly_income: number;
    bonus_income: number;
    fixed_deductions: BudgetFixedDeduction[];
    categories: BudgetCategory[];
    month: string;
  };
  bcaBalance: number;
  briKas: number;
  totalSaldo: number;
  month: string;
  actualSpending: Record<string, number>;
  spendingDetails: Record<string, any[]>;
  loanTotalThisMonth: number;
  loanPaidThisMonth: number;
  recurringTotalThisMonth: number;
  fixedDeductionsTotal: number;
  netAvailable: number;
  totalBudgeted: number;
  totalRemainingBudget: number;
  months: string[];
}

function getUsageColor(used: number, limit: number): string {
  const pct = limit > 0 ? (used / limit) * 100 : 0;
  if (pct >= 100) return "bg-destructive";
  if (pct >= 80) return "bg-warning";
  return "bg-success";
}

function getUsageTextColor(used: number, limit: number): string {
  const pct = limit > 0 ? (used / limit) * 100 : 0;
  if (pct >= 100) return "text-destructive";
  if (pct >= 80) return "text-warning";
  return "text-success";
}

export default function AnggaranClientPage({
  config,
  bcaBalance,
  briKas,
  totalSaldo,
  month,
  actualSpending,
  spendingDetails,
  loanTotalThisMonth,
  loanPaidThisMonth,
  recurringTotalThisMonth,
  fixedDeductionsTotal,
  netAvailable,
  totalBudgeted,
  totalRemainingBudget,
  months,
}: BudgetSummaryProps) {
  const [isPending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [expandedCat, setExpandedCat] = useState<string | null>(null);
  const [bonusInput, setBonusInput] = useState("");
  const [showBonusInput, setShowBonusInput] = useState(false);

  // Local edit state
  const [editIncome, setEditIncome] = useState(config.monthly_income);
  const [editCats, setEditCats] = useState<BudgetCategory[]>(config.categories);
  const [editBca, setEditBca] = useState(bcaBalance);
  const [editBriKas, setEditBriKas] = useState(briKas);

  function handleSave() {
    startTransition(async () => {
      const promises = [
        updateBudgetAction({
          monthly_income: editIncome,
          bonus_income: config.bonus_income,
          fixed_deductions: config.fixed_deductions,
          categories: editCats,
          month: config.month,
        })
      ];

      if (editBca !== bcaBalance) {
        promises.push(updateAccountBalanceAction("bca_angkasa", editBca));
      }
      if (editBriKas !== briKas) {
        promises.push(updateAccountBalanceAction("bri_kas_virtual", editBriKas));
      }

      await Promise.all(promises);
      setEditing(false);
    });
  }

  function handleAddBonus() {
    const amount = parseInt(bonusInput.replace(/\D/g, ""), 10);
    if (!amount || amount <= 0) return;
    startTransition(async () => {
      await addBonusIncomeAction(amount);
      setBonusInput("");
      setShowBonusInput(false);
    });
  }

  function handleResetBonus() {
    startTransition(async () => {
      await resetBonusAction();
    });
  }

  const totalIncome = config.monthly_income + config.bonus_income;
  const isOverBudget = totalBudgeted > netAvailable;
  const budgetDeficit = Math.max(0, totalBudgeted - netAvailable);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-bold tracking-tight md:text-2xl flex items-center gap-2">
          <Target className="h-6 w-6 text-primary shrink-0" />
          Anggaran Pribadi
        </h2>
        <div className="flex items-center gap-2">
          {!editing ? (
            <button
              onClick={() => {
                setEditIncome(config.monthly_income);
                setEditCats([...config.categories]);
                setEditBca(bcaBalance);
                setEditBriKas(briKas);
                setEditing(true);
              }}
              className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-accent transition-colors"
            >
              <Edit2 className="h-3.5 w-3.5" />
              Edit Budget
            </button>
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleSave}
                disabled={isPending}
                className="flex items-center gap-1.5 rounded-lg bg-primary text-primary-foreground px-3 py-1.5 text-xs font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                <Save className="h-3.5 w-3.5" />
                Simpan
              </button>
              <button
                onClick={() => setEditing(false)}
                className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-accent transition-colors"
              >
                <X className="h-3.5 w-3.5" />
                Batal
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Month selector */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {months.map((m) => {
          const active = m === month;
          return (
            <a
              key={m}
              href={`/anggaran?bulan=${m}`}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors border",
                active
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-muted-foreground border-border hover:border-primary/50"
              )}
            >
              {formatMonthCodeLong(m)}
            </a>
          );
        })}
      </div>

      {/* Saldo Cards */}
      <div className="grid grid-cols-2 gap-3">
        <SectionCard icon={Landmark} title="BCA" tone="primary" bodyClassName="py-3">
          {editing ? (
            <input
              type="number"
              value={editBca}
              onChange={(e) => setEditBca(parseInt(e.target.value) || 0)}
              className="w-full rounded-lg border px-2 py-1 text-sm font-bold text-primary"
            />
          ) : (
            <p className="text-xl font-extrabold tabular-nums text-primary">
              {formatRupiah(bcaBalance)}
            </p>
          )}
          <p className="text-[10px] text-muted-foreground mt-1">Dana pribadi murni</p>
        </SectionCard>
        <SectionCard icon={Banknote} title="BRI Kas" tone="warning" bodyClassName="py-3">
          {editing ? (
            <input
              type="number"
              value={editBriKas}
              onChange={(e) => setEditBriKas(parseInt(e.target.value) || 0)}
              className="w-full rounded-lg border px-2 py-1 text-sm font-bold text-warning"
            />
          ) : (
            <p className="text-xl font-extrabold tabular-nums text-warning">
              {formatRupiah(briKas)}
            </p>
          )}
          <p className="text-[10px] text-muted-foreground mt-1">Bersih (tanpa numpang)</p>
        </SectionCard>
      </div>

      <SectionCard icon={Wallet} title="Total Saldo Pribadi" tone="success" bodyClassName="py-4">
        <p className="text-3xl font-extrabold tabular-nums text-success">
          {formatRupiah(editing ? editBca + editBriKas : totalSaldo)}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          BCA + BRI Kas · Bersih milik Pak Angkasa
        </p>
      </SectionCard>

      {/* Income Section */}
      <SectionCard icon={TrendingUp} title="Pendapatan Bulanan" tone="info">
        <div className="space-y-3">
          {editing ? (
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium min-w-[100px]">Gaji Pokok</label>
              <input
                type="number"
                value={editIncome}
                onChange={(e) => setEditIncome(parseInt(e.target.value) || 0)}
                className="flex-1 rounded-lg border px-3 py-2 text-sm"
              />
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Gaji Pokok</span>
              <span className="text-sm font-bold tabular-nums">{formatRupiah(config.monthly_income)}</span>
            </div>
          )}

          {config.bonus_income > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                <Plus className="h-3.5 w-3.5 text-success" />
                Bonus / Tambahan
              </span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold tabular-nums text-success">
                  +{formatRupiah(config.bonus_income)}
                </span>
                <button
                  onClick={handleResetBonus}
                  disabled={isPending}
                  className="p-1 rounded hover:bg-muted text-muted-foreground"
                  title="Reset bonus"
                >
                  <RotateCcw className="h-3 w-3" />
                </button>
              </div>
            </div>
          )}

          <div className="border-t pt-2 flex items-center justify-between">
            <span className="text-sm font-semibold">Total Pendapatan</span>
            <span className="text-lg font-extrabold tabular-nums text-primary">
              {formatRupiah(totalIncome)}
            </span>
          </div>

          {!showBonusInput ? (
            <button
              onClick={() => setShowBonusInput(true)}
              className="flex items-center gap-1.5 text-xs font-medium text-success hover:underline"
            >
              <Plus className="h-3.5 w-3.5" />
              Tambah bonus / pendapatan tambahan
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={bonusInput}
                onChange={(e) => setBonusInput(e.target.value)}
                placeholder="Jumlah bonus..."
                className="flex-1 rounded-lg border px-3 py-2 text-sm"
                autoFocus
              />
              <button
                onClick={handleAddBonus}
                disabled={isPending}
                className="rounded-lg bg-success text-success-foreground px-3 py-2 text-xs font-medium"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => { setShowBonusInput(false); setBonusInput(""); }}
                className="rounded-lg border px-3 py-2 text-xs font-medium"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      </SectionCard>

      {/* Deductions */}
      <SectionCard icon={TrendingDown} title="Pengurang Tetap" tone="danger">
        <div className="space-y-2">
          {config.fixed_deductions.map((d, i) => {
            let amount = d.amount;
            let status = "pending";
            
            if (d.type === "loan") {
              amount = loanTotalThisMonth;
              // Check if fully paid
              if (loanPaidThisMonth >= loanTotalThisMonth && loanTotalThisMonth > 0) {
                status = "lunas";
              }
            } else if (d.type === "recurring") {
              amount = recurringTotalThisMonth;
            }
            
            return (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">{d.name}</span>
                  {status === "lunas" && (
                    <Badge className="bg-success/10 text-success border-success/20 text-[10px] h-4 py-0">LUNAS</Badge>
                  )}
                </div>
                <span className="text-sm font-bold tabular-nums text-destructive">
                  -{formatRupiah(amount)}
                </span>
              </div>
            );
          })}
          <div className="border-t pt-2 flex items-center justify-between">
            <span className="text-sm font-semibold">Total Pengurang</span>
            <div className="text-right">
              <span className="text-sm font-extrabold tabular-nums text-destructive">
                -{formatRupiah(fixedDeductionsTotal)}
              </span>
              <p className="text-[10px] text-muted-foreground">TETAP memotong dana bersih</p>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Net Available */}
      <div className={cn(
        "rounded-xl border p-4 shadow-sm",
        isOverBudget ? "bg-destructive/5 border-destructive/30" : "bg-primary/5 border-primary/30"
      )}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase text-muted-foreground">
              Dana Bersih untuk Dibelanjakan
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {formatRupiah(totalIncome)} − {formatRupiah(fixedDeductionsTotal)}
            </p>
          </div>
          <p className={cn(
            "text-2xl font-extrabold tabular-nums",
            isOverBudget ? "text-destructive" : "text-primary"
          )}>
            {formatRupiah(netAvailable)}
          </p>
        </div>
        {isOverBudget && (
          <div className="mt-2 flex items-center gap-2 text-xs text-destructive">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            Budget melebihi dana bersih sebesar {formatRupiah(budgetDeficit)}
          </div>
        )}
      </div>

      {/* Budget Categories */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Target className="h-4 w-4" />
            Alokasi Budget
          </h3>
          <span className="text-xs text-muted-foreground">
            {formatRupiah(totalBudgeted)} / {formatRupiah(netAvailable)} dialokasikan
          </span>
        </div>

        {editing ? (
          <div className="space-y-2 rounded-xl border p-4 bg-card">
            {editCats.map((cat, idx) => (
              <div key={cat.key} className="flex items-center gap-3">
                <label className="text-sm min-w-[140px] truncate">{cat.name}</label>
                <input
                  type="number"
                  value={cat.limit}
                  onChange={(e) => {
                    const next = [...editCats];
                    next[idx] = { ...next[idx], limit: parseInt(e.target.value) || 0 };
                    setEditCats(next);
                  }}
                  className="flex-1 rounded-lg border px-3 py-2 text-sm"
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {config.categories.map((cat) => {
              const used = actualSpending[cat.key] ?? 0;
              const limit = cat.limit;
              const remaining = Math.max(0, limit - used);
              const pct = limit > 0 ? Math.min((used / limit) * 100, 100) : 0;
              const over = used > limit;
              const details = spendingDetails[cat.key] ?? [];
              const isExpanded = expandedCat === cat.key;

              return (
                <div
                  key={cat.key}
                  className={cn(
                    "rounded-xl border shadow-sm transition-all overflow-hidden",
                    over ? "bg-destructive/5 border-destructive/30" : "bg-card border-border",
                    isExpanded && "ring-1 ring-primary/20"
                  )}
                >
                  <div 
                    className="p-4 cursor-pointer hover:bg-accent/5 transition-colors"
                    onClick={() => setExpandedCat(isExpanded ? null : cat.key)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div
                          className="h-3 w-3 rounded-full shrink-0"
                          style={{ backgroundColor: cat.color ?? "#3b82f6" }}
                        />
                        <span className="text-sm font-semibold">{cat.name}</span>
                        {details.length > 0 && (
                          <span className="text-[10px] text-muted-foreground bg-muted px-1.5 rounded-full">{details.length}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <span className={cn("text-sm font-bold tabular-nums", getUsageTextColor(used, limit))}>
                            {formatRupiah(used)}
                          </span>
                          <span className="text-xs text-muted-foreground"> / {formatRupiah(limit)}</span>
                        </div>
                        {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden">
                      <div
                        className={cn("h-full rounded-full transition-all", getUsageColor(used, limit))}
                        style={{ width: `${pct}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      <span className="text-[10px] text-muted-foreground">
                        {over ? (
                          <span className="text-destructive font-medium">
                            Over budget {formatRupiah(used - limit)}
                          </span>
                        ) : (
                          <span className="text-success">
                            Sisa {formatRupiah(remaining)}
                          </span>
                        )}
                      </span>
                      <span className="text-[10px] tabular-nums text-muted-foreground">
                        {Math.round((used / limit) * 100)}%
                      </span>
                    </div>
                  </div>

                  {/* Details Dropdown */}
                  {isExpanded && (
                    <div className="bg-muted/30 border-t border-border/50 px-4 py-3 space-y-2">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Rincian Pengeluaran</p>
                      {details.length === 0 ? (
                        <p className="text-xs text-muted-foreground italic py-1">Belama ada transaksi tercatat.</p>
                      ) : (
                        <div className="space-y-2">
                          {details.map((d, idx) => (
                            <div key={idx} className="flex items-start justify-between gap-3 text-xs">
                              <div className="min-w-0 flex-1">
                                <p className="font-medium truncate">{d.description}</p>
                                <p className="text-[10px] text-muted-foreground">{formatDateShort(d.date)}</p>
                              </div>
                              <span className="font-bold tabular-nums text-destructive">-{formatRupiah(d.amount)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Summary Footer */}
      <div className="grid grid-cols-2 gap-3">
        <SectionCard icon={CheckCircle2} title="Budget Tersisa" tone="success" bodyClassName="py-3">
          <p className="text-xl font-extrabold tabular-nums text-success">
            {formatRupiah(totalRemainingBudget)}
          </p>
          <p className="text-[10px] text-muted-foreground mt-1">
            Total sisa semua kategori
          </p>
        </SectionCard>
        <SectionCard icon={PiggyBank} title="Tabungan Budget" tone="info" bodyClassName="py-3">
          <p className="text-xl font-extrabold tabular-nums text-info">
            {formatRupiah(actualSpending["savings"] ?? 0)}
          </p>
          <p className="text-[10px] text-muted-foreground mt-1">
            Target: {formatRupiah(config.categories.find((c) => c.key === "savings")?.limit ?? 0)}
          </p>
        </SectionCard>
      </div>

      {/* Disclaimer */}
      <p className="text-[10px] text-muted-foreground text-center px-4">
        Dana pribadi terpisah dari yayasan. Angka actual dari transaksi tercatat di database.
      </p>
    </div>
  );
}
