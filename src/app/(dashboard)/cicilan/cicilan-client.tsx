"use client";

import { useState, useTransition } from "react";
import { formatRupiah } from "@/lib/format";
import { toggleScheduleMonthAction, updateScheduleAmountAction } from "@/lib/actions/obligations";
import { PageHeader } from "@/components/page-header";
import { DashboardPageShell } from "@/components/layout/dashboard-page-shell";
import { DashboardSurface } from "@/components/layout/dashboard-surface";
import { SectionGroupHeader } from "@/components/section-group-header";
import { cn } from "@/lib/utils";
import { CreditCard, ChevronDown, ChevronUp, Edit2, Save, X } from "lucide-react";

interface ScheduleItem {
  month: string;
  amount: number;
  status: string;
  paid_at?: string;
}

interface Loan {
  _id: string;
  item: string;
  due_day?: number | string;
  schedule?: ScheduleItem[];
}

interface CicilanClientProps {
  loans: Loan[];
  currentMonth: string;
}

function monthLabel(month: string) {
  const d = new Date(month + "-01");
  return d.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
}

function shortMonth(month: string) {
  const d = new Date(month + "-01");
  return d.toLocaleDateString("id-ID", { month: "short" });
}

export default function CicilanClientPage({ loans, currentMonth }: CicilanClientProps) {
  const [isPending, startTransition] = useTransition();
  const [localLoans, setLocalLoans] = useState<Loan[]>(loans);
  const [openMonth, setOpenMonth] = useState<string | null>(currentMonth);
  const [editingItem, setEditingItem] = useState<{ loanId: string; month: string } | null>(null);
  const [editAmount, setEditAmount] = useState<string>("");

  // Group by month
  const monthGroups: Record<string, { loanId: string; loanName: string; due_day?: number | string; item: ScheduleItem }[]> = {};
  const history: { month: string; loanName: string; amount: number; paid_at?: string }[] = [];

  localLoans.forEach((loan) => {
    (loan.schedule ?? []).forEach((s) => {
      if (s.status === "lunas") {
        history.push({ month: s.month, loanName: loan.item, amount: s.amount, paid_at: s.paid_at });
      } else {
        if (!monthGroups[s.month]) monthGroups[s.month] = [];
        monthGroups[s.month].push({ loanId: loan._id, loanName: loan.item, due_day: loan.due_day, item: s });
      }
    });
  });

  const months = Object.keys(monthGroups).sort();

  function handleToggle(loanId: string, month: string, checked: boolean) {
    setLocalLoans((prev) =>
      prev.map((loan) => {
        if (loan._id !== loanId) return loan;
        return {
          ...loan,
          schedule: (loan.schedule ?? []).map((s) =>
            s.month === month ? { ...s, status: checked ? "lunas" : "pending" } : s
          ),
        };
      })
    );
    startTransition(async () => {
      await toggleScheduleMonthAction(loanId, month, checked);
    });
  }

  function handleEditAmount(loanId: string, month: string, currentAmount: number) {
    setEditingItem({ loanId, month });
    setEditAmount(currentAmount.toString());
  }

  function saveAmount(loanId: string, month: string) {
    const amount = parseInt(editAmount, 10);
    if (isNaN(amount) || amount <= 0) return;

    setLocalLoans((prev) =>
      prev.map((loan) => {
        if (loan._id !== loanId) return loan;
        return {
          ...loan,
          schedule: (loan.schedule ?? []).map((s) =>
            s.month === month ? { ...s, amount } : s
          ),
        };
      })
    );
    startTransition(async () => {
      await updateScheduleAmountAction(loanId, month, amount);
    });
    setEditingItem(null);
  }

  // Progress per loan
  const loanProgress = localLoans.map((loan) => {
    const sched = loan.schedule ?? [];
    const paid = sched.filter((s) => s.status === "lunas").length;
    const total = sched.length;
    const remaining = sched.filter((s) => s.status !== "lunas").reduce((s, r) => s + r.amount, 0);
    return { ...loan, paid, total, remaining, pct: total > 0 ? (paid / total) * 100 : 0 };
  });

  return (
    <DashboardPageShell gap="relaxed" maxWidth="narrow">
      <PageHeader icon={CreditCard} title="Cicilan Bulanan" />

      {/* Progress Overview */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {loanProgress.map((loan) => (
          <DashboardSurface key={loan._id} className="p-4">
            <p className="text-[11px] font-semibold uppercase text-muted-foreground truncate">{loan.item}</p>
            <p className="text-lg font-bold tabular-nums mt-1">{formatRupiah(loan.remaining)}</p>
            <div className="mt-2 h-1.5 w-full bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${loan.pct}%` }} />
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">{loan.paid}/{loan.total} lunas</p>
          </DashboardSurface>
        ))}
      </div>

      {/* Monthly Schedule */}
      <div className="space-y-3">
        <SectionGroupHeader label="Jadwal pembayaran" count={months.length} />

        {months.map((month) => {
          const items = monthGroups[month];
          const total = items.reduce((s, i) => s + i.item.amount, 0);
          const paidTotal = items.filter((i) => i.item.status === "lunas").reduce((s, i) => s + i.item.amount, 0);
          const remaining = total - paidTotal;
          const isOpen = openMonth === month;
          const isCurrent = month === currentMonth;

          return (
            <DashboardSurface
              key={month}
              className={cn(
                "overflow-hidden p-0 transition-all",
                isCurrent ? "border-warning bg-warning/5" : "border-border bg-card",
              )}
            >
              <button
                onClick={() => setOpenMonth(isOpen ? null : month)}
                className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold ${
                    isCurrent ? "bg-warning text-warning-foreground" : "bg-primary/10 text-primary"
                  }`}>
                    {shortMonth(month)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{monthLabel(month)}</p>
                    <p className="text-[10px] text-muted-foreground">{items.length} cicilan</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className={`text-sm font-bold tabular-nums ${remaining === 0 ? "text-success line-through" : ""}`}>
                      {formatRupiah(remaining)}
                    </p>
                    {paidTotal > 0 && remaining > 0 && (
                      <p className="text-[10px] text-muted-foreground line-through">{formatRupiah(total)}</p>
                    )}
                  </div>
                  {isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                </div>
              </button>

              {isOpen && (
                <div className="px-4 pb-4 space-y-1">
                  {items.map((it, idx) => {
                    const isEditing = editingItem?.loanId === it.loanId && editingItem?.month === month;
                    return (
                      <div
                        key={`${it.loanId}-${idx}`}
                        className={`flex items-center gap-3 py-2.5 rounded-lg px-2 transition-colors ${
                          it.item.status === "lunas" ? "bg-success/5" : "hover:bg-accent/30"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={it.item.status === "lunas"}
                          onChange={(e) => handleToggle(it.loanId, month, e.target.checked)}
                          disabled={isPending}
                          className="h-5 w-5 rounded border-muted-foreground/30 text-primary focus:ring-primary disabled:opacity-50 shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <p className={`text-sm font-medium truncate ${it.item.status === "lunas" ? "line-through text-muted-foreground" : ""}`}>
                            {it.loanName}
                          </p>
                          <p className="text-[10px] text-muted-foreground">Jatuh tempo tgl {it.due_day ?? "-"}</p>
                        </div>
                        
                        {isEditing ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              value={editAmount}
                              onChange={(e) => setEditAmount(e.target.value)}
                              className="w-24 text-right text-sm border rounded px-2 py-1"
                              autoFocus
                            />
                            <button onClick={() => saveAmount(it.loanId, month)} className="p-1 text-success hover:bg-success/10 rounded">
                              <Save className="h-3.5 w-3.5" />
                            </button>
                            <button onClick={() => setEditingItem(null)} className="p-1 text-destructive hover:bg-destructive/10 rounded">
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleEditAmount(it.loanId, month, it.item.amount)}
                            className={`text-sm font-semibold tabular-nums flex items-center gap-1 ${
                              it.item.status === "lunas" ? "line-through text-muted-foreground" : ""
                            }`}
                          >
                            {formatRupiah(it.item.amount)}
                            <Edit2 className="h-3 w-3 opacity-0 group-hover:opacity-100" />
                          </button>
                        )}
                      </div>
                    );
                  })}

                  <div className="flex justify-between items-center pt-2 border-t mt-2">
                    <span className="text-xs text-muted-foreground">Sisa tagihan</span>
                    <span className="text-sm font-bold tabular-nums">{formatRupiah(remaining)}</span>
                  </div>
                </div>
              )}
            </DashboardSurface>
          );
        })}
      </div>

      {/* History */}
      {history.length > 0 && (
        <div className="space-y-3">
          <SectionGroupHeader label="Riwayat lunas" count={history.length} />
          <div className="space-y-2">
            {history.map((h, idx) => (
              <DashboardSurface
                key={idx}
                className="flex items-center justify-between bg-muted/40 px-3 py-2 shadow-sm"
              >
                <div>
                  <p className="text-sm font-medium">{h.loanName}</p>
                  <p className="text-[10px] text-muted-foreground">{monthLabel(h.month)}</p>
                </div>
                <span className="text-sm font-semibold tabular-nums text-muted-foreground line-through">
                  {formatRupiah(h.amount)}
                </span>
              </DashboardSurface>
            ))}
          </div>
        </div>
      )}
    </DashboardPageShell>
  );
}
