import { getAgendaForOwner } from "@/lib/dal";
import { requireDashboardSession } from "@/lib/dashboard-auth";
import { PageHeader } from "@/components/page-header";
import { FilterTabs, type FilterTab } from "@/components/filter-bar";
import {
  AgendaCreateButton,
  type AgendaDoc,
} from "@/components/agenda-manager";
import { AgendaCard } from "@/components/agenda-card";
import { KATEGORI_CONFIG, getDueStatus } from "@/lib/agenda-config";
import { MeterBar, agendaMeterFillClass } from "@/components/meter-bar";
import { KpiStrip, type KpiItem } from "@/components/kpi-strip";
import { KategoriChips } from "@/components/kategori-chips";
import { SectionGroupHeader } from "@/components/section-group-header";
import { cn } from "@/lib/utils";
import type { AgendaKategori } from "@/lib/actions/agenda";
import { CalendarCheck2, ListChecks, AlertCircle } from "lucide-react";
import { DashboardPageShell } from "@/components/layout/dashboard-page-shell";

export const dynamic = "force-dynamic";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PRIORITY_ORDER = { tinggi: 0, sedang: 1, rendah: 2 };

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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  await requireDashboardSession();

  const params = await searchParams;
  const view = (params.view ?? "belum") as "belum" | "selesai" | "semua";
  const kategoriFilter = params.kategori ?? null;

  const all = await getAgendaForOwner("angkasa") as AgendaDoc[];

  const belum = all.filter((a) => a.status === "belum");
  const selesai = all.filter((a) => a.status === "selesai");

  belum.sort((a, b) => {
    const po = PRIORITY_ORDER[a.priority as keyof typeof PRIORITY_ORDER] - PRIORITY_ORDER[b.priority as keyof typeof PRIORITY_ORDER];
    return po !== 0 ? po : a.due_date.localeCompare(b.due_date);
  });
  selesai.sort((a, b) => {
    const ca = a.completed_at ?? a.due_date;
    const cb = b.completed_at ?? b.due_date;
    return cb.localeCompare(ca);
  });

  const baseItems = view === "belum" ? belum : view === "selesai" ? selesai : all;
  const displayed = kategoriFilter
    ? baseItems.filter((a) => (a.kategori ?? "lainnya") === kategoriFilter)
    : baseItems;

  const terlambat = belum.filter((a) => getDueStatus(a.due_date, a.status) === "terlambat").length;
  const hariIni   = belum.filter((a) => getDueStatus(a.due_date, a.status) === "hari_ini").length;
  const mendesak  = terlambat + hariIni;

  const pct = all.length === 0 ? 0 : Math.round((selesai.length / all.length) * 100);

  const baseHref = `/agenda?view=${view}`;
  const grouped = (view === "belum" || view === "semua") && !kategoriFilter
    ? groupAgenda(displayed.filter((a) => a.status === "belum"))
    : null;

  const tabs: FilterTab[] = [
    { label: "Belum Selesai", href: "/agenda?view=belum",  active: view === "belum",  count: belum.length },
    { label: "Selesai",       href: "/agenda?view=selesai",active: view === "selesai",count: selesai.length },
    { label: "Semua",         href: "/agenda?view=semua",  active: view === "semua",  count: all.length },
  ];

  const kpis: KpiItem[] = [
    {
      label: "Mendesak",
      value: String(mendesak),
      icon: AlertCircle,
      tone: mendesak > 0 ? "danger" : "muted",
      valueTone: mendesak > 0 ? "danger" : undefined,
      hint: mendesak > 0 ? `${terlambat} terlambat · ${hariIni} hari ini` : "Tidak ada",
    },
    {
      label: "Belum Selesai",
      value: String(belum.length),
      icon: ListChecks,
      tone: "neutral",
    },
    {
      label: "Selesai",
      value: String(selesai.length),
      icon: CalendarCheck2,
      tone: "success",
      valueTone: "success",
    },
  ];

  return (
    <DashboardPageShell>
      <PageHeader icon={CalendarCheck2} title="Agenda Saya">
        <AgendaCreateButton />
      </PageHeader>

      {all.length > 0 && <KpiStrip items={kpis} cols={3} />}

      {all.length > 0 && (
        <div className="rounded-xl border border-border/60 bg-card px-4 py-3 shadow-sm">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
            <span className="font-medium">Progress keseluruhan</span>
            <span>
              <span className="font-bold tabular-nums text-foreground">{selesai.length}/{all.length}</span>
              {" "}selesai{" "}
              <span className={cn(
                "font-bold",
                pct === 100 ? "text-success" : pct >= 60 ? "text-info" : pct >= 30 ? "text-warning" : "text-destructive",
              )}>
                ({pct}%)
              </span>
            </span>
          </div>
          <MeterBar
            percent={pct}
            fillClassName={cn(agendaMeterFillClass(pct), "duration-700 ease-out")}
            heightClassName="h-2.5"
          />
        </div>
      )}

      <FilterTabs tabs={tabs} />

      {baseItems.length > 0 && (
        <KategoriChips
          items={baseItems}
          getKey={(a) => (a.kategori ?? "lainnya") as string}
          configMap={KATEGORI_CONFIG as Record<string, { label: string; emoji: string; cls: string }>}
          activeKey={kategoriFilter}
          baseHref={baseHref}
        />
      )}

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

      {grouped && grouped.length > 0 && (
        <div className="space-y-6">
          {grouped.map(([groupLabel, items]) => (
            <div key={groupLabel} className="space-y-2.5">
              <SectionGroupHeader label={groupLabel} count={items.length} />
              <div className="space-y-2">
                {items.map((agenda) => (
                  <AgendaCard key={agenda._id.toString()} agenda={agenda} />
                ))}
              </div>
            </div>
          ))}

          {view === "semua" && selesai.length > 0 && (
            <div className="space-y-2.5">
              <SectionGroupHeader label="✅ Selesai" count={selesai.length} />
              <div className="space-y-2 opacity-75">
                {selesai.map((agenda) => (
                  <AgendaCard key={agenda._id.toString()} agenda={agenda} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {!grouped && displayed.length > 0 && (
        <div className="space-y-2">
          {displayed.map((agenda) => (
            <AgendaCard key={agenda._id.toString()} agenda={agenda} />
          ))}
        </div>
      )}
    </DashboardPageShell>
  );
}
