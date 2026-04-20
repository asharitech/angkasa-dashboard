"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatRupiah, formatDateShort } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { BuktiButton } from "@/components/bukti-button";
import { PengajuanRowActions } from "@/components/pengajuan-row-actions";
import { obligationStatusTone, toneBadge } from "@/lib/colors";
import { formatFundSource, formatStatusLabel } from "@/lib/names";
import type { Account, Obligation } from "@/lib/types";

const PREVIEW_LIMIT = 3;

function itemDate(o: Obligation) {
  if (o.status === "lunas" && o.resolved_at) return formatDateShort(o.resolved_at);
  if (o.date_spent) return formatDateShort(o.date_spent);
  return formatDateShort(o.created_at);
}

export function PengajuanAccordionRow({
  o,
  index,
  isAdmin,
  yayasanAccounts,
}: {
  o: Obligation;
  index: number;
  isAdmin: boolean;
  yayasanAccounts: Account[];
}) {
  const [open, setOpen] = useState(false);
  const details = o.detail ?? [];
  const hasDetails = details.length > 0;
  const preview = details.slice(0, PREVIEW_LIMIT);
  const remainder = details.length - preview.length;

  return (
    <div className="py-3">
      {/* Summary row — always visible */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full text-left"
      >
        <div className="flex items-start gap-3">
          <span className="mt-0.5 w-5 shrink-0 text-sm font-medium text-muted-foreground tabular-nums">
            {index + 1}.
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <p className="min-w-0 text-[15px] font-semibold leading-snug text-foreground">
                {o.item}
              </p>
              <div className="flex shrink-0 items-center gap-1.5">
                <p className="text-[15px] font-semibold tabular-nums text-foreground">
                  {o.amount ? formatRupiah(o.amount) : "—"}
                </p>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 text-muted-foreground transition-transform duration-200",
                    open && "rotate-180",
                  )}
                />
              </div>
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
              <Badge
                className={cn(
                  "h-5 px-2 font-medium",
                  toneBadge[obligationStatusTone(o.status)],
                )}
              >
                {formatStatusLabel(o.status)}
              </Badge>
              {o.category ? (
                <span className="rounded-md bg-muted/60 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                  {o.category.replace(/_/g, " ")}
                </span>
              ) : null}
              <span>{formatFundSource(o.sumber_dana) || "—"}</span>
              <span aria-hidden>·</span>
              <span>{itemDate(o)}</span>
            </div>

            {/* Collapsed preview */}
            {hasDetails && !open && (
              <ul className="mt-2 space-y-0.5 text-xs text-muted-foreground">
                {preview.map((d, i) => (
                  <li key={`${o._id}-pv-${i}`} className="flex items-start gap-2">
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

      {/* Animated expand */}
      <div
        className={cn(
          "grid transition-all duration-200 ease-out",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="overflow-hidden">
          <div className="mt-3 space-y-3 pl-8 text-sm">
            {hasDetails && (
              <div>
                <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Rincian
                </p>
                <ul className="space-y-1">
                  {details.map((d, i) => (
                    <li
                      key={`${o._id}-${i}`}
                      className="flex items-start justify-between gap-3 text-sm"
                    >
                      <span className="min-w-0 text-muted-foreground">
                        <span className="mr-2 tabular-nums">{i + 1}.</span>
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

            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span>Dibuat {formatDateShort(o.created_at)}</span>
                {o.resolved_at ? (
                  <span>• Selesai {formatDateShort(o.resolved_at)}</span>
                ) : null}
              </div>
              {isAdmin && (
                <div className="flex items-center gap-1">
                  <BuktiButton
                    obligationId={o._id}
                    buktiUrl={o.bukti_url}
                    buktiType={o.bukti_type}
                    itemLabel={o.item}
                  />
                  <PengajuanRowActions
                    obligation={o}
                    accounts={yayasanAccounts}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
