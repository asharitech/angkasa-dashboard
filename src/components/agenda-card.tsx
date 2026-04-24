"use client";

import { useState } from "react";
import { AgendaRowActions, AgendaReopenButton } from "./agenda-manager";
import type { AgendaDoc } from "./agenda-manager";
import { KATEGORI_CONFIG } from "@/lib/agenda-config";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  CalendarCheck2,
  Clock,
  AlertCircle,
  CheckCircle2,
  Flame,
  ChevronDown,
  ChevronUp,
  Package,
} from "lucide-react";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const PRIORITY_CONFIG = {
  tinggi: {
    label: "Tinggi",
    dot: "bg-destructive",
    text: "text-destructive",
    bar: "bg-destructive",
  },
  sedang: {
    label: "Sedang",
    dot: "bg-warning",
    text: "text-warning",
    bar: "bg-warning",
  },
  rendah: {
    label: "Rendah",
    dot: "bg-success",
    text: "text-success",
    bar: "bg-success",
  },
};

type DueStatus = "terlambat" | "hari_ini" | "besok" | "segera" | "normal" | "selesai";

function getDueStatus(dueDate: string, status: string): DueStatus {
  if (status === "selesai") return "selesai";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  const diff = Math.round((due.getTime() - today.getTime()) / 86_400_000);
  if (diff < 0) return "terlambat";
  if (diff === 0) return "hari_ini";
  if (diff === 1) return "besok";
  if (diff <= 5) return "segera";
  return "normal";
}

function getDiffDays(dueDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  return Math.round((due.getTime() - today.getTime()) / 86_400_000);
}

function CountdownPill({ dueDate, status }: { dueDate: string; status: string }) {
  const ds = getDueStatus(dueDate, status);
  const diff = getDiffDays(dueDate);
  const days = Math.abs(diff);

  if (ds === "terlambat")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-[11px] font-semibold text-destructive ring-1 ring-destructive/20">
        <AlertCircle className="h-3 w-3" />
        {days === 1 ? "Terlambat 1 hari" : `Terlambat ${days} hari`}
      </span>
    );
  if (ds === "hari_ini")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-warning/10 px-2 py-0.5 text-[11px] font-semibold text-warning ring-1 ring-warning/20">
        <Flame className="h-3 w-3" />
        Hari ini
      </span>
    );
  if (ds === "besok")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-warning/5 px-2 py-0.5 text-[11px] font-semibold text-warning ring-1 ring-warning/10">
        <Clock className="h-3 w-3" />
        Besok
      </span>
    );
  if (ds === "segera")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-info/10 px-2 py-0.5 text-[11px] font-semibold text-info ring-1 ring-info/20">
        <Clock className="h-3 w-3" />
        {diff} hari lagi
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
      <Clock className="h-3 w-3" />
      {diff} hari lagi
    </span>
  );
}

// Parse deskripsi — kalau ada koma/newline → render sebagai checklist item
function parseDetailItems(description: string): string[] | null {
  // Split by newline or comma
  const parts = description
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  // Only treat as item list if ≥2 parts and no part is too long (>80 chars)
  if (parts.length >= 2 && parts.every((p) => p.length <= 100)) {
    return parts;
  }
  return null;
}

// ─── Card Component ───────────────────────────────────────────────────────────

export function AgendaCard({
  agenda,
}: {
  agenda: AgendaDoc & { completed_at?: string | null };
}) {
  const [expanded, setExpanded] = useState(false);
  const done = agenda.status === "selesai";
  const ds = getDueStatus(agenda.due_date, agenda.status);
  const pCfg = PRIORITY_CONFIG[agenda.priority] ?? PRIORITY_CONFIG.sedang;
  const kCfg = KATEGORI_CONFIG[agenda.kategori ?? "lainnya"] ?? KATEGORI_CONFIG.lainnya;

  // Parse description into items if possible
  const detailItems = agenda.description ? parseDetailItems(agenda.description) : null;
  const hasDetail = !!agenda.description;
  const isLong = agenda.description && agenda.description.length > 80 && !detailItems;

  // Card border/bg based on urgency
  const cardCls = done
    ? "border-border/30 bg-muted/20 opacity-60"
    : ds === "terlambat"
    ? "border-destructive/40 bg-gradient-to-br from-destructive/5 to-transparent shadow-sm shadow-destructive/10"
    : ds === "hari_ini"
    ? "border-warning/40 bg-gradient-to-br from-warning/5 to-transparent shadow-sm shadow-warning/10"
    : ds === "besok"
    ? "border-warning/20 bg-gradient-to-br from-warning/4 to-transparent"
    : "border-border/60 bg-card shadow-sm hover:shadow-md hover:border-border/80";

  return (
    <div className={cn("group relative rounded-2xl border transition-all duration-200", cardCls)}>
      {/* Priority left accent bar */}
      {!done && (
        <div
          className={cn(
            "absolute left-0 top-4 bottom-4 w-[3px] rounded-r-full",
            pCfg.bar,
          )}
        />
      )}

      {/* Main content */}
      <div className="flex gap-3 px-4 py-3.5 pl-5">
        {/* Actions column */}
        <div className="flex shrink-0 flex-col items-center gap-1.5 pt-0.5">
          <AgendaRowActions agenda={agenda} />
        </div>

        {/* Body */}
        <div className="min-w-0 flex-1">
          {/* Title + priority */}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <p
              className={cn(
                "text-sm font-semibold leading-snug",
                done && "line-through text-muted-foreground",
              )}
            >
              {agenda.title}
            </p>
            {/* Priority dot */}
            <span className={cn("h-2 w-2 rounded-full shrink-0", pCfg.dot)} />
            <span className={cn("text-[10px] font-semibold", pCfg.text)}>
              {pCfg.label}
            </span>
          </div>

          {/* Description — short inline / long with expand */}
          {hasDetail && (
            <div className="mt-1.5">
              {detailItems ? (
                /* Checklist items */
                <div className="space-y-1">
                  {(expanded ? detailItems : detailItems.slice(0, 3)).map((item, i) => (
                    <div key={i} className="flex items-start gap-1.5">
                      <Package className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground/60" />
                      <span className="text-xs text-muted-foreground leading-relaxed">{item}</span>
                    </div>
                  ))}
                  {detailItems.length > 3 && (
                    <button
                      onClick={() => setExpanded((v) => !v)}
                      className="flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
                    >
                      {expanded ? (
                        <>
                          <ChevronUp className="h-3 w-3" />
                          Sembunyikan
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-3 w-3" />
                          +{detailItems.length - 3} item lagi
                        </>
                      )}
                    </button>
                  )}
                </div>
              ) : isLong ? (
                /* Long prose — truncate with expand */
                <div>
                  <p
                    className={cn(
                      "text-xs text-muted-foreground leading-relaxed",
                      !expanded && "line-clamp-2",
                    )}
                  >
                    {agenda.description}
                  </p>
                  <button
                    onClick={() => setExpanded((v) => !v)}
                    className="mt-0.5 flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
                  >
                    {expanded ? (
                      <>
                        <ChevronUp className="h-3 w-3" />
                        Tutup
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-3 w-3" />
                        Selengkapnya
                      </>
                    )}
                  </button>
                </div>
              ) : (
                /* Short prose — show as-is */
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {agenda.description}
                </p>
              )}
            </div>
          )}

          {/* Meta row */}
          <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1.5">
            {/* Due date */}
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <CalendarCheck2 className="h-3 w-3 shrink-0" />
              <span className="font-medium">{formatDate(agenda.due_date)}</span>
            </span>

            {/* Countdown pill */}
            {!done && <CountdownPill dueDate={agenda.due_date} status={agenda.status} />}

            {/* Kategori chip */}
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium",
                kCfg.cls,
              )}
            >
              {kCfg.emoji} {kCfg.label}
            </span>

            {/* Selesai */}
            {done && agenda.completed_at && (
              <span className="inline-flex items-center gap-1 text-xs text-success">
                <CheckCircle2 className="h-3 w-3" />
                Selesai {formatDate(agenda.completed_at)}
              </span>
            )}
            {done && (
              <AgendaReopenButton id={agenda._id.toString()} status={agenda.status} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
