import { getDb } from "@/lib/mongodb";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { SectionCard } from "@/components/section-card";
import { FilterTabs } from "@/components/filter-bar";
import { Badge } from "@/components/ui/badge";
import {
  AgendaCreateButton,
  AgendaRowActions,
  AgendaReopenButton,
  type AgendaDoc,
} from "@/components/agenda-manager";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  CalendarCheck2,
  ClipboardList,
  Clock,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

export const dynamic = "force-dynamic";

const PRIORITY_ORDER = { tinggi: 0, sedang: 1, rendah: 2 };
const PRIORITY_BADGE: Record<string, { label: string; cls: string }> = {
  tinggi: { label: "Tinggi", cls: "bg-rose-500/10 text-rose-600 border-rose-500/20" },
  sedang: { label: "Sedang", cls: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
  rendah: { label: "Rendah", cls: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
};

function getDueStatus(dueDate: string, status: string) {
  if (status === "selesai") return "selesai";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil((due.getTime() - today.getTime()) / 86_400_000);
  if (diffDays < 0) return "terlambat";
  if (diffDays === 0) return "hari_ini";
  if (diffDays <= 3) return "segera";
  return "normal";
}

function DueBadge({ dueDate, status }: { dueDate: string; status: string }) {
  const ds = getDueStatus(dueDate, status);
  if (ds === "selesai") return null;
  if (ds === "terlambat")
    return (
      <span className="flex items-center gap-1 text-xs font-medium text-rose-600">
        <AlertCircle className="h-3 w-3" />
        Terlambat
      </span>
    );
  if (ds === "hari_ini")
    return (
      <span className="flex items-center gap-1 text-xs font-medium text-amber-600">
        <Clock className="h-3 w-3" />
        Hari ini
      </span>
    );
  if (ds === "segera")
    return (
      <span className="flex items-center gap-1 text-xs font-medium text-orange-500">
        <Clock className="h-3 w-3" />
        Segera
      </span>
    );
  return null;
}

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const params = await searchParams;
  const view = (params.view ?? "belum") as "belum" | "selesai" | "semua";

  const db = await getDb();
  const all = (await db
    .collection("agenda")
    .find({ owner: "angkasa" })
    .sort({ due_date: 1, created_at: -1 })
    .toArray()) as unknown as (AgendaDoc & { completed_at?: string | null })[];

  const belum = all.filter((a) => a.status === "belum");
  const selesai = all.filter((a) => a.status === "selesai");

  // Sort belum: priority first, then due_date
  belum.sort((a, b) => {
    const po = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
    if (po !== 0) return po;
    return a.due_date.localeCompare(b.due_date);
  });

  // Sort selesai: most recent completed first
  selesai.sort((a, b) => {
    const ca = a.completed_at ?? a.due_date;
    const cb = b.completed_at ?? b.due_date;
    return cb.localeCompare(ca);
  });

  const displayed = view === "belum" ? belum : view === "selesai" ? selesai : all;

  // Stats
  const terlambat = belum.filter((a) => getDueStatus(a.due_date, a.status) === "terlambat").length;
  const hariIni = belum.filter((a) => getDueStatus(a.due_date, a.status) === "hari_ini").length;
  const segera = belum.filter((a) => getDueStatus(a.due_date, a.status) === "segera").length;

  const tabs: import("@/components/filter-bar").FilterTab[] = [
    {
      label: "Belum Selesai",
      href: "/agenda?view=belum",
      active: view === "belum",
      count: belum.length,
    },
    {
      label: "Selesai",
      href: "/agenda?view=selesai",
      active: view === "selesai",
      count: selesai.length,
    },
    {
      label: "Semua",
      href: "/agenda?view=semua",
      active: view === "semua",
      count: all.length,
    },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <PageHeader icon={CalendarCheck2} title="Agenda Saya">
        <AgendaCreateButton />
      </PageHeader>

      {/* KPI strip */}
      {belum.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-border/60 bg-card p-3 text-center shadow-sm">
            <p className="text-2xl font-bold tabular-nums">{belum.length}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">Belum selesai</p>
          </div>
          <div
            className={cn(
              "rounded-xl border p-3 text-center shadow-sm",
              terlambat > 0
                ? "border-rose-500/20 bg-rose-500/5"
                : "border-border/60 bg-card",
            )}
          >
            <p
              className={cn(
                "text-2xl font-bold tabular-nums",
                terlambat > 0 && "text-rose-600",
              )}
            >
              {terlambat + hariIni}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">Mendesak</p>
          </div>
          <div className="rounded-xl border border-border/60 bg-card p-3 text-center shadow-sm">
            <p className="text-2xl font-bold tabular-nums text-emerald-600">
              {selesai.length}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">Selesai</p>
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <FilterTabs tabs={tabs} />

      {/* List */}
      {displayed.length === 0 ? (
        <SectionCard icon={ClipboardList} title="Agenda" tone="muted">
          <div className="py-10 text-center text-sm text-muted-foreground">
            {view === "belum"
              ? "Tidak ada agenda yang perlu dikerjakan. Semua beres! ✅"
              : view === "selesai"
              ? "Belum ada agenda yang diselesaikan."
              : "Belum ada agenda. Tambah agenda baru di atas."}
          </div>
        </SectionCard>
      ) : (
        <div className="space-y-2.5">
          {displayed.map((agenda) => {
            const done = agenda.status === "selesai";
            const ds = getDueStatus(agenda.due_date, agenda.status);
            const pBadge = PRIORITY_BADGE[agenda.priority] ?? PRIORITY_BADGE.sedang;

            return (
              <div
                key={agenda._id.toString()}
                className={cn(
                  "group relative flex items-start gap-3 rounded-xl border p-4 transition-all",
                  done
                    ? "border-border/40 bg-muted/30 opacity-70"
                    : ds === "terlambat"
                    ? "border-rose-500/30 bg-rose-500/5"
                    : ds === "hari_ini"
                    ? "border-amber-500/30 bg-amber-500/5"
                    : "border-border/60 bg-card shadow-sm hover:shadow-md",
                )}
              >
                {/* Row actions at the left (toggle checkbox) */}
                <div className="mt-0.5 shrink-0">
                  <AgendaRowActions agenda={agenda} />
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start gap-x-2 gap-y-1">
                    <p
                      className={cn(
                        "text-sm font-semibold leading-snug",
                        done && "line-through text-muted-foreground",
                      )}
                    >
                      {agenda.title}
                    </p>
                    <Badge
                      variant="outline"
                      className={cn("text-[10px] px-1.5 py-0 h-4", pBadge.cls)}
                    >
                      {pBadge.label}
                    </Badge>
                  </div>

                  {agenda.description && (
                    <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                      {agenda.description}
                    </p>
                  )}

                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                    {/* Due date */}
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <CalendarCheck2 className="h-3 w-3" />
                      {formatDate(agenda.due_date)}
                    </span>

                    {/* Due status badge */}
                    <DueBadge dueDate={agenda.due_date} status={agenda.status} />

                    {/* If done — show completed_at + reopen */}
                    {done && agenda.completed_at && (
                      <span className="flex items-center gap-1 text-xs text-emerald-600">
                        <CheckCircle2 className="h-3 w-3" />
                        Selesai {formatDate(agenda.completed_at)}
                      </span>
                    )}
                    {done && (
                      <AgendaReopenButton
                        id={agenda._id.toString()}
                        status={agenda.status}
                      />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
