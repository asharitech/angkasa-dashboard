"use client";

import { useState } from "react";
import { ChevronDown, CheckCircle2, Clock, CalendarDays, Bell, AlertCircle, Calendar } from "lucide-react";
import { monthLabel } from "@/lib/periods";
import { cn } from "@/lib/utils";
import { formatRupiah, formatDateShort } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Obligation } from "@/lib/types";
import { markLunasAction, unmarkLunasAction } from "@/lib/actions/obligations";
import { RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { WajibBulananEditButton, WajibBulananDeleteButton } from "./wajib-bulanan-actions";

const PREVIEW_LIMIT = 3;

interface WajibBulananRowProps {
  item: Obligation;
  index: number;
  isAdmin: boolean;
  yayasanAccounts: { _id: string; bank: string }[];
}

function getDaysUntilDue(dueDay: number | null | undefined): number | null {
  if (!dueDay) return null;
  const today = new Date();
  const currentDay = today.getDate();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  
  if (dueDay >= currentDay) {
    return dueDay - currentDay;
  } else {
    // Sudah lewat, hitung untuk bulan depan
    return daysInMonth - currentDay + dueDay;
  }
}

function getUrgencyColor(daysUntil: number | null, isLunas: boolean): string {
  if (isLunas) return "text-emerald-600 bg-emerald-50 border-emerald-200";
  if (daysUntil === null) return "text-muted-foreground bg-muted";
  if (daysUntil <= 3) return "text-rose-600 bg-rose-50 border-rose-200";
  if (daysUntil <= 7) return "text-amber-600 bg-amber-50 border-amber-200";
  return "text-blue-600 bg-blue-50 border-blue-200";
}

export function WajibBulananRow({ item, index, isAdmin, yayasanAccounts }: WajibBulananRowProps) {
  const [open, setOpen] = useState(false);
  const [marking, setMarking] = useState(false);
  const router = useRouter();

  const isLunas = item.status === "lunas";
  const dueDay = item.due_day ? Number(item.due_day) : null;
  const daysUntil = getDaysUntilDue(dueDay);
  const details = item.detail ?? [];
  const hasDetails = details.length > 0;
  const preview = details.slice(0, PREVIEW_LIMIT);
  const remainder = details.length - preview.length;

  async function handleMarkLunas() {
    if (!isAdmin || isLunas) return;
    setMarking(true);
    try {
      const defaultAccount = yayasanAccounts[0]?._id || "btn_yayasan";
      const today = new Date().toISOString().slice(0, 10);
      await markLunasAction({
        obligationId: item._id as string,
        account: defaultAccount,
        date: today,
        amount: item.amount ?? 0,
        description: `Pembayaran ${item.item}`,
      });
      router.refresh();
    } finally {
      setMarking(false);
    }
  }

  async function handleUnmarkLunas() {
    if (!isAdmin || !isLunas) return;
    setMarking(true);
    try {
      await unmarkLunasAction(item._id);
      router.refresh();
    } finally {
      setMarking(false);
    }
  }

  return (
    <div className={cn("py-3", isLunas && "bg-emerald-50/30")}>
      {/* Summary row */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full text-left"
      >
        <div className="flex items-start gap-3">
          {/* Checkbox / Number */}
          <div className="mt-0.5 flex shrink-0 items-center gap-2">
            {isLunas ? (
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              </div>
            ) : (
              <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-muted-foreground/30">
                <span className="text-xs font-medium text-muted-foreground">{index + 1}</span>
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className={cn(
                  "text-[15px] font-semibold leading-snug",
                  isLunas && "text-muted-foreground line-through"
                )}>
                  {item.item}
                </p>
                
                {/* Meta badges */}
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  {/* Status badge */}
                  <Badge
                    className={cn(
                      "h-5 px-2 text-[10px] font-medium",
                      isLunas 
                        ? "bg-emerald-100 text-emerald-700 border-emerald-200" 
                        : "bg-amber-100 text-amber-700 border-amber-200"
                    )}
                  >
                    {isLunas ? "Sudah Dibayar" : "Belum Dibayar"}
                  </Badge>
                  
                  {/* Month badge */}
                  {item.month && (
                    <Badge variant="outline" className="h-5 px-2 text-[10px] font-medium text-purple-600 bg-purple-50 border-purple-200">
                      <Calendar className="h-3 w-3 mr-1" />
                      {monthLabel(item.month, "short")}
                    </Badge>
                  )}

                  {/* Due date badge */}
                  {dueDay && (
                    <Badge 
                      variant="outline" 
                      className={cn(
                        "h-5 px-2 text-[10px] font-medium",
                        getUrgencyColor(daysUntil, isLunas)
                      )}
                    >
                      <CalendarDays className="h-3 w-3 mr-1" />
                      Jatuh tempo: tgl {dueDay}
                      {!isLunas && daysUntil !== null && (
                        <span className="ml-1">
                          ({daysUntil === 0 ? "hari ini" : `${daysUntil} hari lagi`})
                        </span>
                      )}
                    </Badge>
                  )}

                  {/* Reminder badge */}
                  {item.reminder_days && !isLunas && (
                    <Badge variant="outline" className="h-5 px-2 text-[10px] font-medium text-blue-600 bg-blue-50 border-blue-200">
                      <Bell className="h-3 w-3 mr-1" />
                      H-{item.reminder_days}
                    </Badge>
                  )}
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-1.5">
                <p className={cn(
                  "text-[15px] font-semibold tabular-nums",
                  isLunas && "text-muted-foreground"
                )}>
                  {item.amount ? formatRupiah(item.amount) : "—"}
                </p>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 text-muted-foreground transition-transform duration-200",
                    open && "rotate-180",
                  )}
                />
              </div>
            </div>

            {/* Collapsed preview */}
            {hasDetails && !open && (
              <ul className="mt-2 space-y-0.5 text-xs text-muted-foreground">
                {preview.map((d, i) => (
                  <li key={`${item._id}-pv-${i}`} className="flex items-start gap-2">
                    <span className="text-muted-foreground/60">•</span>
                    <span className="min-w-0 flex-1 truncate">{d.item}</span>
                    <span className="shrink-0 tabular-nums">{formatRupiah(d.amount)}</span>
                  </li>
                ))}
                {remainder > 0 && (
                  <li className="text-[11px] italic text-muted-foreground/70">
                    +{remainder} item lainnya — klik untuk lihat semua
                  </li>
                )}
              </ul>
            )}
          </div>
        </div>
      </button>

      {/* Expanded content */}
      <div
        className={cn(
          "grid transition-all duration-200 ease-out",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="overflow-hidden">
          <div className="mt-3 space-y-3 pl-11 text-sm">
            {hasDetails && (
              <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Rincian Pembayaran
                </p>
                <ul className="space-y-1.5">
                  {details.map((d, i) => (
                    <li
                      key={`${item._id}-${i}`}
                      className="flex items-start justify-between gap-3 text-sm"
                    >
                      <span className="min-w-0 text-muted-foreground">
                        <span className="mr-2 tabular-nums text-muted-foreground/60">{i + 1}.</span>
                        {d.item}
                      </span>
                      <span className="shrink-0 font-medium tabular-nums">
                        {formatRupiah(d.amount)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Info and actions */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span>Dibuat {formatDateShort(item.created_at)}</span>
                {item.resolved_at && (
                  <span className="text-emerald-600">• Dibayar {formatDateShort(item.resolved_at)}</span>
                )}
              </div>
              
              {isAdmin && (
                <div className="flex items-center gap-1">
                  {isLunas ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={handleUnmarkLunas}
                      disabled={marking}
                    >
                      <RotateCcw className="h-3.5 w-3.5 mr-1" />
                      Batal Lunas
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700"
                      onClick={handleMarkLunas}
                      disabled={marking}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                      Tandai Lunas
                    </Button>
                  )}
                  <WajibBulananEditButton item={item} />
                  <WajibBulananDeleteButton item={item} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
