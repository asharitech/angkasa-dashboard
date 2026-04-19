import { getDb } from "@/lib/mongodb";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { FilterTabs } from "@/components/filter-bar";
import { Badge } from "@/components/ui/badge";
import {
  AgendaCreateButton,
  AgendaRowActions,
  AgendaReopenButton,
  KATEGORI_CONFIG,
  type AgendaDoc,
} from "@/components/agenda-manager";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { AgendaKategori } from "@/lib/actions/agenda";
import {
  CalendarCheck2,
  Clock,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  Flame,
  ListChecks,
} from "lucide-react";

export const dynamic = "force-dynamic";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PRIORITY_ORDER = { tinggi: 0, sedang: 1, rendah: 2 };

const PRIORITY_CONFIG = {
  tinggi: { label: "Tinggi",  dot: "bg-rose-500",   badge: "bg-rose-500/10 text-rose-600 border-rose-500/20" },
  sedang: { label: "Sedang",  dot: "bg-amber-400",  badge: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
  rendah: { label: "Rendah",  dot: "bg-emerald-500",badge: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
};

type DueStatus = "terlambat" | "hari_ini" | "besok" | "segera" | "normal" | "selesai";

function getDueStatus(dueDate: string, status: string): DueStatus {
  if (status === "selesai") return "selesai";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  const diff = Math.round((due.getTime() - today.getTime()) / 86_400_000);
  if (diff < 0)  return "terlambat";
  if (diff === 0) return "hari_ini";
  if (diff === 1) return "besok";
  if (diff <= 5)  return "segera";
  return "normal";
}

function getDiffDays(dueDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  return Math.round((due.getTime() - today.getTime()) / 86_400_000);
}

function CountdownLabel({ dueDate, status }: { dueDate: string; status: string }) {
  const ds = getDueStatus(dueDate, status);
  const diff = getDiffDays(dueDate);

  if (ds === "terlambat") {
    const days = Math.abs(diff);
    return (
      <span className="flex items-center gap-1 rounded-full bg-rose-500/10 px-2 py-0.5 text-[11px] font-semibold text-rose-600">
        <AlertCircle className="h-3 w-3" />
        {days === 1 ? "Terlambat 1 hari" : `Terlambat ${days} hari`}
      </span>
    );
  }
  if (ds === "hari_ini") {
    return (
      <span className="flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-semibold text-amber-600">
        <Flame className="h-3 w-3" />
        Hari ini
      </span>
    );
  }
  if (ds === "besok") {
    return (
      <span className="flex items-center gap-1 rounded-full bg-orange-500/10 px-2 py-0.5 text-[11px] font-semibold text-orange-500">
        <Clock className="h-3 w-3" />
        Besok
      </span>
    );
  }
  if (ds === "segera") {
    return (
      <span className="flex items-center gap-1 rounded-full bg-blue-500/10 px-2 py-0.5 text-[11px] font-semibold text-blue-500">
        <Clock className="h-3 w-3" />
        {diff} hari lagi
      </span>
    );
  }
  return (
    <span className="text-[11px] text-muted-foreground">
      {diff} hari lagi
    </span>
  );
}

// ─── Group by date ─────────────────────────────────────────────────────────────

function getGroupLabel(dueDate: string): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  const diff = Math.round((due.getTime() - today.getTime()) / 86_400_000);
  if (diff < 0)  return "⚠️ Terlambat";
  if (diff === 0) return "🔥 Hari Ini";
  if (diff === 1) return "📅 Besok";
  if (diff <= 7)  return "📆 Minggu Ini";
  return "🗓️ Mendatang";
}

const GROUP_ORDER: Record<string, number> = {
  "⚠️ Terlambat": 0,
  "🔥 Hari Ini": 1,
  "📅 Besok": 2,
  "📆 Minggu Ini": 3,
  "🗓️ Mendatang": 4,
};

function groupAgenda(items: AgendaDoc[]) {
  const groups = new Map<string, AgendaDoc[]>();
  for (const item of items) {
    const label = getGroupLabel(item.due_date);
    if (!groups.has(label)) groups.set(label, []);
    groups.get(label)!.push(item);
  }
  return [...groups.entries()].sort(
    ([a], [b]) => (GROUP_ORDER[a] ?? 99) - (GROUP_ORDER[b] ?? 99),
  );
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────

function ProgressBar({ done, total }: { done: number; total: number }) {
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-muted-foreground">Progress Keseluruhan</span>
        <span className="font-semibold tabular-nums">
          {done}/{total} selesai ({pct}%)
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            pct === 100
              ? "bg-emerald-500"
              : pct >= 60
              ? "bg-blue-500"
              : pct >= 30
              ? "bg-amber-400"
              : "bg-rose-500",
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ─── Category filter chips ────────────────────────────────────────────────────

function KategoriChips({
  all,
  active,
}: {
  all: AgendaDoc[];
  active: string | null;
}) {
  const counts = new Map<string, number>();
  for (const a of all) {
    const k = a.kategori ?? "lainnya";
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  if (counts.size <= 1) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {[...counts.entries()].map(([key, count]) => {
        const cfg = KATEGORI_CONFIG[key as AgendaKategori] ?? KATEGORI_CONFIG.lainnya;
        const isActive = active === key;
        return (
          <a
            key={key}
            href={isActive ? "/agenda" : `/agenda?kategori=${key}`}
            className={cn(
              "flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-all",
              isActive
                ? cfg.cls + " shadow-sm"
                : "border-border/60 bg-muted/40 text-muted-foreground hover:bg-muted",
            )}
          >
            <span>{cfg.emoji}</span>
            <span>{cfg.label}</span>
            <span className="ml-0.5 rounded-full bg-background/60 px-1 tabular-nums">{count}</span>
          </a>
        );
      })}
    </div>
  );
}

// ─── Agenda Card ──────────────────────────────────────────────────────────────

function AgendaCard({
  agenda,
}: {
  agenda: AgendaDoc & { completed_at?: string | null };
}) {
  const done = agenda.status === "selesai";
  const ds = getDueStatus(agenda.due_date, agenda.status);
  const pCfg = PRIORITY_CONFIG[agenda.priority] ?? PRIORITY_CONFIG.sedang;
  const kCfg = KATEGORI_CONFIG[agenda.kategori ?? "lainnya"] ?? KATEGORI_CONFIG.lainnya;

  return (
    <div
      className={cn(
        "group relative flex gap-3 rounded-2xl border p-4 transition-all duration-200",
        done
          ? "border-border/30 bg-muted/20 opacity-60"
          : ds === "terlambat"
          ? "border-rose-400/40 bg-rose-500/5 shadow-sm shadow-rose-500/10"
          : ds === "hari_ini"
          ? "border-amber-400/40 bg-amber-500/5 shadow-sm shadow-amber-500/10"
          : ds === "besok"
          ? "border-orange-400/30 bg-orange-500/5"
          : "border-border/60 bg-card shadow-sm hover:shadow-md hover:border-border",
      )}
    >
      {/* Priority accent bar */}
      {!done && (
        <div
          className={cn(
            "absolute left-0 top-3 bottom-3 w-1 rounded-r-full",
            pCfg.dot,
          )}
        />
      )}

      {/* Actions column (checkbox + edit + delete) */}
      <div className="ml-2 flex shrink-0 flex-col items-center gap-1.5 pt-0.5">
        <AgendaRowActions agenda={agenda} />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        {/* Title row */}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <p
            className={cn(
              "text-sm font-semibold leading-snug",
              done && "line-through text-muted-foreground",
            )}
          >
            {agenda.title}
          </p>
          {/* Priority dot badge */}
          <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", pCfg.dot)} />
          <span className="text-[10px] font-medium text-muted-foreground">{pCfg.label}</span>
        </div>

        {/* Description */}
        {agenda.description && (
          <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
            {agenda.description}
          </p>
        )}

        {/* Meta row */}
        <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1.5">
          {/* Date */}
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <CalendarCheck2 className="h-3 w-3 shrink-0" />
            {formatDate(agenda.due_date)}
          </span>

          {/* Countdown */}
          {!done && <CountdownLabel dueDate={agenda.due_date} status={agenda.status} />}

          {/* Kategori chip */}
          <span
            className={cn(
              "flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium",
              kCfg.cls,
            )}
          >
            {kCfg.emoji} {kCfg.label}
          </span>

          {/* Completed at */}
          {done && agenda.completed_at && (
            <span className="flex items-center gap-1 text-xs text-emerald-600">
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
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const params = await searchParams;
  const view = (params.view ?? "belum") as "belum" | "selesai" | "semua";
  const kategoriFilter = params.kategori ?? null;

  const db = await getDb();
  const all = (await db
    .collection("agenda")
    .find({ owner: "angkasa" })
    .sort({ due_date: 1, created_at: -1 })
    .toArray()) as unknown as (AgendaDoc & { completed_at?: string | null })[];

  const belum = all.filter((a) => a.status === "belum");
  const selesai = all.filter((a) => a.status === "selesai");

  // Sort belum: priority first → due_date
  belum.sort((a, b) => {
    const po = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
    return po !== 0 ? po : a.due_date.localeCompare(b.due_date);
  });

  // Sort selesai: most recently completed first
  selesai.sort((a, b) => {
    const ca = a.completed_at ?? a.due_date;
    const cb = b.completed_at ?? b.due_date;
    return cb.localeCompare(ca);
  });

  let displayed: typeof all =
    view === "belum" ? belum : view === "selesai" ? selesai : all;

  // Apply kategori filter
  const baseForFilter = view === "belum" ? belum : view === "selesai" ? selesai : all;
  if (kategoriFilter) {
    displayed = baseForFilter.filter(
      (a) => (a.kategori ?? "lainnya") === kategoriFilter,
    );
  }

  // Stats
  const terlambat = belum.filter((a) => getDueStatus(a.due_date, a.status) === "terlambat").length;
  const hariIni   = belum.filter((a) => getDueStatus(a.due_date, a.status) === "hari_ini").length;

  // Groups (only for belum view)
  const grouped = view === "belum" || (view === "semua" && !kategoriFilter)
    ? groupAgenda(displayed.filter((a) => a.status === "belum"))
    : null;

  const tabs: import("@/components/filter-bar").FilterTab[] = [
    { label: "Belum Selesai", href: "/agenda?view=belum", active: view === "belum", count: belum.length },
    { label: "Selesai",       href: "/agenda?view=selesai", active: view === "selesai", count: selesai.length },
    { label: "Semua",         href: "/agenda?view=semua", active: view === "semua", count: all.length },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <PageHeader icon={CalendarCheck2} title="Agenda Saya">
        <AgendaCreateButton />
      </PageHeader>

      {/* KPI strip */}
      {all.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div
            className={cn(
              "rounded-2xl border p-3 text-center shadow-sm",
              (terlambat + hariIni) > 0
                ? "border-rose-400/30 bg-rose-500/5"
                : "border-border/60 bg-card",
            )}
          >
            <p className={cn(
              "text-2xl font-bold tabular-nums",
              (terlambat + hariIni) > 0 ? "text-rose-600" : "text-foreground",
            )}>
              {terlambat + hariIni}
            </p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">Mendesak</p>
          </div>
          <div className="rounded-2xl border border-border/60 bg-card p-3 text-center shadow-sm">
            <p className="text-2xl font-bold tabular-nums">{belum.length}</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">Belum selesai</p>
          </div>
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-center shadow-sm">
            <p className="text-2xl font-bold tabular-nums text-emerald-600">{selesai.length}</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">Selesai</p>
          </div>
        </div>
      )}

      {/* Progress bar */}
      {all.length > 0 && (
        <div className="rounded-2xl border border-border/60 bg-card px-4 py-3 shadow-sm">
          <ProgressBar done={selesai.length} total={all.length} />
        </div>
      )}

      {/* Filter tabs */}
      <FilterTabs tabs={tabs} />

      {/* Category chips */}
      {displayed.length > 0 && (
        <KategoriChips
          all={view === "belum" ? belum : view === "selesai" ? selesai : all}
          active={kategoriFilter}
        />
      )}

      {/* Empty state */}
      {displayed.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border/60 py-16 text-center">
          <ListChecks className="h-8 w-8 text-muted-foreground/40" />
          <p className="text-sm font-medium text-muted-foreground">
            {kategoriFilter
              ? `Tidak ada agenda kategori "${KATEGORI_CONFIG[kategoriFilter as AgendaKategori]?.label ?? kategoriFilter}"`
              : view === "belum"
              ? "Semua agenda selesai! 🎉"
              : view === "selesai"
              ? "Belum ada yang diselesaikan."
              : "Belum ada agenda. Tambah di atas."}
          </p>
        </div>
      )}

      {/* Grouped list (belum / semua non-filter) */}
      {grouped && grouped.length > 0 && (
        <div className="space-y-5">
          {grouped.map(([groupLabel, items]) => (
            <div key={groupLabel} className="space-y-2">
              <div className="flex items-center gap-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {groupLabel}
                </p>
                <span className="rounded-full bg-muted px-1.5 py-px text-[10px] font-medium tabular-nums text-muted-foreground">
                  {items.length}
                </span>
              </div>
              <div className="space-y-2">
                {items.map((agenda) => (
                  <AgendaCard key={agenda._id.toString()} agenda={agenda} />
                ))}
              </div>
            </div>
          ))}
          {/* Selesai section at the bottom in "semua" view */}
          {view === "semua" && selesai.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  ✅ Selesai
                </p>
                <span className="rounded-full bg-muted px-1.5 py-px text-[10px] font-medium tabular-nums text-muted-foreground">
                  {selesai.length}
                </span>
              </div>
              <div className="space-y-2">
                {selesai.map((agenda) => (
                  <AgendaCard key={agenda._id.toString()} agenda={agenda} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Flat list for selesai view or kategori filter */}
      {!grouped && displayed.length > 0 && (
        <div className="space-y-2">
          {displayed.map((agenda) => (
            <AgendaCard key={agenda._id.toString()} agenda={agenda} />
          ))}
        </div>
      )}
    </div>
  );
}
