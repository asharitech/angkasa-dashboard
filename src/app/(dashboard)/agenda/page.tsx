import { getDb } from "@/lib/mongodb";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { FilterTabs } from "@/components/filter-bar";
import {
  AgendaCreateButton,
  KATEGORI_CONFIG,
  type AgendaDoc,
} from "@/components/agenda-manager";
import { AgendaCard } from "@/components/agenda-card";
import { cn } from "@/lib/utils";
import type { AgendaKategori } from "@/lib/actions/agenda";
import { CalendarCheck2, ListChecks, AlertCircle, Flame } from "lucide-react";

export const dynamic = "force-dynamic";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PRIORITY_ORDER = { tinggi: 0, sedang: 1, rendah: 2 };

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

// ─── Group by date section ────────────────────────────────────────────────────

function getGroupLabel(dueDate: string): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  const diff = Math.round((due.getTime() - today.getTime()) / 86_400_000);
  if (diff < 0)   return "⚠️ Terlambat";
  if (diff === 0) return "🔥 Hari Ini";
  if (diff === 1) return "📅 Besok";
  if (diff <= 7)  return "📆 Minggu Ini";
  return "🗓️ Mendatang";
}

const GROUP_ORDER: Record<string, number> = {
  "⚠️ Terlambat": 0,
  "🔥 Hari Ini":  1,
  "📅 Besok":     2,
  "📆 Minggu Ini":3,
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
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">Progress keseluruhan</span>
        <span className="text-xs font-bold tabular-nums">
          {done}/{total}{" "}
          <span className="font-normal text-muted-foreground">selesai</span>{" "}
          <span
            className={cn(
              "font-bold",
              pct === 100
                ? "text-emerald-600"
                : pct >= 60
                ? "text-blue-500"
                : pct >= 30
                ? "text-amber-500"
                : "text-rose-500",
            )}
          >
            ({pct}%)
          </span>
        </span>
      </div>
      <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-700 ease-out",
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

// ─── Kategori filter chips ────────────────────────────────────────────────────

function KategoriChips({
  items,
  activeKategori,
  baseHref,
}: {
  items: AgendaDoc[];
  activeKategori: string | null;
  baseHref: string;
}) {
  const counts = new Map<string, number>();
  for (const a of items) {
    const k = a.kategori ?? "lainnya";
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  if (counts.size <= 1) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {[...counts.entries()].map(([key, count]) => {
        const cfg = KATEGORI_CONFIG[key as AgendaKategori] ?? KATEGORI_CONFIG.lainnya;
        const isActive = activeKategori === key;
        return (
          <a
            key={key}
            href={isActive ? baseHref : `${baseHref}&kategori=${key}`}
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-all",
              isActive
                ? cn(cfg.cls, "shadow-sm scale-[1.02]")
                : "border-border/50 bg-muted/30 text-muted-foreground hover:bg-muted hover:text-foreground",
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

// ─── Section header with count ────────────────────────────────────────────────

function SectionLabel({ label, count }: { label: string; count: number }) {
  return (
    <div className="flex items-center gap-2 pb-0.5">
      <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <span className="rounded-full bg-muted px-1.5 py-px text-[10px] font-semibold tabular-nums text-muted-foreground">
        {count}
      </span>
      <div className="flex-1 h-px bg-border/60" />
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

  // Sort belum: priority first → due_date ascending
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

  const baseItems = view === "belum" ? belum : view === "selesai" ? selesai : all;
  const displayed = kategoriFilter
    ? baseItems.filter((a) => (a.kategori ?? "lainnya") === kategoriFilter)
    : baseItems;

  // Stats
  const terlambat = belum.filter((a) => getDueStatus(a.due_date, a.status) === "terlambat").length;
  const hariIni   = belum.filter((a) => getDueStatus(a.due_date, a.status) === "hari_ini").length;
  const mendesak  = terlambat + hariIni;

  const baseHref = `/agenda?view=${view}`;
  const grouped = (view === "belum" || view === "semua") && !kategoriFilter
    ? groupAgenda(displayed.filter((a) => a.status === "belum"))
    : null;

  const tabs: import("@/components/filter-bar").FilterTab[] = [
    { label: "Belum Selesai", href: "/agenda?view=belum",  active: view === "belum",  count: belum.length },
    { label: "Selesai",       href: "/agenda?view=selesai",active: view === "selesai",count: selesai.length },
    { label: "Semua",         href: "/agenda?view=semua",  active: view === "semua",  count: all.length },
  ];

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <PageHeader icon={CalendarCheck2} title="Agenda Saya">
        <AgendaCreateButton />
      </PageHeader>

      {/* ── KPI tiles ── */}
      {all.length > 0 && (
        <div className="grid grid-cols-3 gap-2.5">
          {/* Mendesak */}
          <div
            className={cn(
              "flex flex-col items-center justify-center rounded-2xl border p-3 text-center shadow-sm",
              mendesak > 0
                ? "border-rose-400/40 bg-gradient-to-b from-rose-500/8 to-rose-500/4"
                : "border-border/60 bg-card",
            )}
          >
            {mendesak > 0 ? (
              <AlertCircle className="mb-1 h-4 w-4 text-rose-500" />
            ) : (
              <Flame className="mb-1 h-4 w-4 text-muted-foreground/30" />
            )}
            <p className={cn("text-2xl font-bold tabular-nums leading-none", mendesak > 0 ? "text-rose-600" : "text-foreground")}>
              {mendesak}
            </p>
            <p className="mt-1 text-[10px] text-muted-foreground">Mendesak</p>
          </div>
          {/* Belum */}
          <div className="flex flex-col items-center justify-center rounded-2xl border border-border/60 bg-card p-3 text-center shadow-sm">
            <ListChecks className="mb-1 h-4 w-4 text-muted-foreground/50" />
            <p className="text-2xl font-bold tabular-nums leading-none">{belum.length}</p>
            <p className="mt-1 text-[10px] text-muted-foreground">Belum selesai</p>
          </div>
          {/* Selesai */}
          <div className="flex flex-col items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-center shadow-sm">
            <CalendarCheck2 className="mb-1 h-4 w-4 text-emerald-500" />
            <p className="text-2xl font-bold tabular-nums leading-none text-emerald-600">{selesai.length}</p>
            <p className="mt-1 text-[10px] text-muted-foreground">Selesai</p>
          </div>
        </div>
      )}

      {/* ── Progress bar ── */}
      {all.length > 0 && (
        <div className="rounded-2xl border border-border/60 bg-card px-4 py-3 shadow-sm">
          <ProgressBar done={selesai.length} total={all.length} />
        </div>
      )}

      {/* ── View tabs ── */}
      <FilterTabs tabs={tabs} />

      {/* ── Kategori filter chips ── */}
      {baseItems.length > 0 && (
        <KategoriChips
          items={baseItems}
          activeKategori={kategoriFilter}
          baseHref={baseHref}
        />
      )}

      {/* ── Empty state ── */}
      {displayed.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border/60 py-16 text-center">
          <ListChecks className="h-10 w-10 text-muted-foreground/20" />
          <div>
            <p className="text-sm font-semibold text-muted-foreground">
              {kategoriFilter
                ? `Tidak ada agenda "${KATEGORI_CONFIG[kategoriFilter as AgendaKategori]?.label ?? kategoriFilter}"`
                : view === "belum"
                ? "Semua agenda selesai! 🎉"
                : view === "selesai"
                ? "Belum ada yang diselesaikan."
                : "Belum ada agenda."}
            </p>
            {view === "belum" && !kategoriFilter && (
              <p className="mt-0.5 text-xs text-muted-foreground">
                Tambah agenda baru dengan tombol di atas.
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── Grouped list (belum / semua) ── */}
      {grouped && grouped.length > 0 && (
        <div className="space-y-6">
          {grouped.map(([groupLabel, items]) => (
            <div key={groupLabel} className="space-y-2.5">
              <SectionLabel label={groupLabel} count={items.length} />
              <div className="space-y-2">
                {items.map((agenda) => (
                  <AgendaCard key={agenda._id.toString()} agenda={agenda} />
                ))}
              </div>
            </div>
          ))}

          {/* Selesai section in "semua" view */}
          {view === "semua" && selesai.length > 0 && (
            <div className="space-y-2.5">
              <SectionLabel label="✅ Selesai" count={selesai.length} />
              <div className="space-y-2 opacity-75">
                {selesai.map((agenda) => (
                  <AgendaCard key={agenda._id.toString()} agenda={agenda} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Flat list (selesai view / kategori filter) ── */}
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
