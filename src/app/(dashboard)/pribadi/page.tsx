import { getPengeluaranAngkasa } from "@/lib/data";
import { formatRupiah, formatDateShort } from "@/lib/format";
import { idString } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { SectionCard } from "@/components/section-card";
import { Wallet, Receipt, CalendarDays, Tag } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const KATEGORI_GRUP = {
  harian: {
    label: "Harian",
    cats: ["belanja", "makan", "pulsa", "gym", "pribadi_puang"],
    color: "info" as const,
  },
  bulanan: {
    label: "Bulanan",
    cats: ["listrik"],
    color: "warning" as const,
  },
  piutang: {
    label: "Piutang Yayasan",
    cats: ["piutang_yayasan"],
    color: "destructive" as const,
  },
  savings: {
    label: "Savings",
    cats: ["savings"],
    color: "success" as const,
  },
  lainnya: {
    label: "Lainnya",
    cats: ["reimburse_dilla", "angkasa_terpakai"],
    color: "secondary" as const,
  },
};

type GrupKey = keyof typeof KATEGORI_GRUP;

function getGrupKategori(cat: string | null | undefined): GrupKey | null {
  if (!cat) return null;
  for (const [grup, config] of Object.entries(KATEGORI_GRUP)) {
    if (config.cats.includes(cat)) return grup as GrupKey;
  }
  return null;
}

function getNamaBulan(monthCode: string): string {
  const [year, month] = monthCode.split("-");
  const names = ["", "Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  const m = parseInt(month, 10);
  return `${names[m] ?? month} ${year}`;
}

function namaKategori(cat: string | null | undefined): string {
  if (!cat) return "Lainnya";
  return cat.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
}

export default async function PribadiPage({
  searchParams,
}: {
  searchParams: Promise<{ bulan?: string; grup?: string }>;
}) {
  const params = await searchParams;
  const data = await getPengeluaranAngkasa(params.bulan);
  const activeMonth = params.bulan ?? data.months[0] ?? "";
  const activeGrup = (params.grup as GrupKey | undefined) ?? undefined;

  const filteredEntries = activeGrup
    ? data.entries.filter((e) => {
        const g = getGrupKategori(e.category);
        return g === activeGrup;
      })
    : data.entries;

  const filteredTotal = filteredEntries.reduce((s, e) => s + e.amount, 0);

  // Summary by category group for active month
  const grupTotals = new Map<GrupKey, number>();
  for (const e of data.entries) {
    const g = getGrupKategori(e.category);
    if (!g) continue;
    grupTotals.set(g, (grupTotals.get(g) ?? 0) + e.amount);
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-bold tracking-tight md:text-2xl flex items-center gap-2">
          <Wallet className="h-6 w-6 text-primary shrink-0" />
          Pengeluaran Angkasa
        </h2>
      </div>

      {/* Month Tabs */}
      {data.months.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {data.months.map((m) => {
            const active = m === activeMonth;
            return (
              <Link
                key={m}
                href={`/pribadi?bulan=${m}${activeGrup ? `&grup=${activeGrup}` : ""}`}
                className={cn(
                  "flex-shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-all whitespace-nowrap",
                  active
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                {getNamaBulan(m)}
              </Link>
            );
          })}
        </div>
      )}

      {/* Total Card */}
      <SectionCard icon={Receipt} title={getNamaBulan(activeMonth)} tone="primary">
        <div className="flex items-baseline justify-between py-2">
          <span className="text-sm text-muted-foreground">Total Pengeluaran</span>
          <span className="text-2xl font-extrabold tabular-nums text-destructive">
            {formatRupiah(filteredTotal)}
          </span>
        </div>
        <div className="flex items-baseline justify-between py-2 border-t border-border/40">
          <span className="text-sm text-muted-foreground">Jumlah Transaksi</span>
          <span className="text-lg font-bold tabular-nums">
            {filteredEntries.length} <span className="text-sm font-normal text-muted-foreground">item</span>
          </span>
        </div>
      </SectionCard>

      {/* Category Group Filters */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Tag className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">Filter Kategori</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/pribadi?bulan=${activeMonth}`}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all border",
              !activeGrup
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background text-muted-foreground border-border hover:border-primary/50"
            )}
          >
            Semua
          </Link>
          {(Object.entries(KATEGORI_GRUP) as [GrupKey, typeof KATEGORI_GRUP[GrupKey]][]).map(([key, config]) => {
            const total = grupTotals.get(key) ?? 0;
            const active = activeGrup === key;
            return (
              <Link
                key={key}
                href={`/pribadi?bulan=${activeMonth}&grup=${key}`}
                className={cn(
                  "rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all border flex items-center gap-1.5",
                  active
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-muted-foreground border-border hover:border-primary/50"
                )}
              >
                {config.label}
                {total > 0 && (
                  <span className={cn("tabular-nums", active ? "text-primary-foreground/70" : "text-muted-foreground/60")}>
                    {formatRupiah(total).replace("Rp", "").trim()}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Transaction List */}
      <SectionCard icon={CalendarDays} title="Detail Transaksi" tone="muted">
        {filteredEntries.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground text-sm">
            Tidak ada transaksi untuk filter ini.
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {filteredEntries.map((entry) => {
              const grup = getGrupKategori(entry.category);
              const grupConfig = grup ? KATEGORI_GRUP[grup] : null;
              return (
                <div
                  key={idString(entry._id)}
                  className="flex items-center justify-between gap-3 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold truncate">
                      {entry.description}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">
                        {formatDateShort(entry.date)}
                      </span>
                      <Badge variant={grupConfig?.color ?? "outline"} className="text-[10px] h-5 px-1.5">
                        {namaKategori(entry.category)}
                      </Badge>
                    </div>
                  </div>
                  <span className="text-sm font-bold tabular-nums text-destructive shrink-0">
                    {formatRupiah(entry.amount)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>

      {/* Category Summary */}
      {data.categorySummary.length > 0 && (
        <SectionCard icon={Tag} title="Rincian per Kategori" tone="info">
          <div className="divide-y divide-border/50">
            {data.categorySummary.map((cat) => {
              const grup = getGrupKategori(cat._id);
              const grupConfig = grup ? KATEGORI_GRUP[grup] : null;
              const isActive = !activeGrup || grup === activeGrup;
              return (
                <div
                  key={cat._id}
                  className={cn(
                    "flex items-center justify-between py-2.5",
                    !isActive && "opacity-40"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Badge variant={grupConfig?.color ?? "outline"} className="text-[10px] h-5 px-1.5">
                      {namaKategori(cat._id)}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{cat.count}x</span>
                  </div>
                  <span className="text-sm font-bold tabular-nums">
                    {formatRupiah(cat.total)}
                  </span>
                </div>
              );
            })}
          </div>
        </SectionCard>
      )}
    </div>
  );
}
