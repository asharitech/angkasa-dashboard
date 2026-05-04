import { getPengeluaranAngkasa } from "@/lib/data";
import { formatRupiah, formatDateShort } from "@/lib/format";
import { idString } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { SectionCard } from "@/components/section-card";
import { Wallet, Receipt, CalendarDays, Tag, ArrowDownLeft, ArrowUpRight, Scale } from "lucide-react";
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
        if (e.direction === "in") return false;
        const g = getGrupKategori(e.category);
        return g === activeGrup;
      })
    : data.entries;

  const cf = data.currentCashflow ?? { in: 0, out: 0 };
  const net = cf.in - cf.out;
  const totalFlow = cf.in + cf.out;
  const inPct = totalFlow > 0 ? (cf.in / totalFlow) * 100 : 0;
  const outPct = totalFlow > 0 ? (cf.out / totalFlow) * 100 : 0;

  // Summary by category group for OUT entries only
  const grupTotals = new Map<GrupKey, number>();
  for (const e of data.entriesOut) {
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

      {/* Month List — berjejer ke bawah */}
      {data.months.length > 0 && (
        <div className="space-y-2">
          {data.months.map((m) => {
            const active = m === activeMonth;
            const cfMonth = (data.cashflowByMonth as Record<string, { in: number; out: number }>)[m] ?? { in: 0, out: 0 };
            return (
              <Link
                key={m}
                href={`/pribadi?bulan=${m}${activeGrup ? `&grup=${activeGrup}` : ""}`}
                className={cn(
                  "block rounded-xl border px-4 py-3 transition-all",
                  active
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-card border-border hover:border-primary/40 hover:shadow-sm"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className={cn("font-semibold", active ? "text-primary-foreground" : "text-foreground")}>
                    {getNamaBulan(m)}
                  </span>
                  <span className={cn("text-sm font-bold tabular-nums", active ? "text-primary-foreground/90" : "text-destructive")}>
                    {formatRupiah(cfMonth.out)}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className={cn("text-xs", active ? "text-primary-foreground/70" : "text-muted-foreground")}>
                    {cfMonth.in > 0 && <>masuk {formatRupiah(cfMonth.in)} · </>}
                    keluar {formatRupiah(cfMonth.out)}
                  </span>
                  <span className={cn("text-xs tabular-nums", active ? "text-primary-foreground/70" : "text-muted-foreground")}>
                    net {cfMonth.in - cfMonth.out >= 0 ? "+" : ""}{formatRupiah(cfMonth.in - cfMonth.out)}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Cashflow Card */}
      <SectionCard icon={Scale} title={`Cashflow — ${getNamaBulan(activeMonth)}`} tone="primary">
        {/* In / Out Bars */}
        <div className="space-y-3 py-1">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1.5">
              <ArrowDownLeft className="h-4 w-4 text-success" />
              <span className="text-muted-foreground">Masuk</span>
            </div>
            <span className="font-bold tabular-nums text-success">{formatRupiah(cf.in)}</span>
          </div>
          <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden flex">
            <div
              className="h-full bg-success transition-all"
              style={{ width: `${inPct}%` }}
            />
            <div
              className="h-full bg-destructive transition-all"
              style={{ width: `${outPct}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1.5">
              <ArrowUpRight className="h-4 w-4 text-destructive" />
              <span className="text-muted-foreground">Keluar</span>
            </div>
            <span className="font-bold tabular-nums text-destructive">{formatRupiah(cf.out)}</span>
          </div>
        </div>

        {/* Net */}
        <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between">
          <span className="text-sm font-medium">Selisih Bersih</span>
          <span
            className={cn(
              "text-xl font-extrabold tabular-nums",
              net >= 0 ? "text-success" : "text-destructive"
            )}
          >
            {net >= 0 ? "+" : ""}{formatRupiah(net)}
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
              const isOut = entry.direction === "out";
              const grup = isOut ? getGrupKategori(entry.category) : null;
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
                      {isOut ? (
                        <Badge variant={grupConfig?.color ?? "outline"} className="text-[10px] h-5 px-1.5">
                          {namaKategori(entry.category)}
                        </Badge>
                      ) : (
                        <Badge variant="success" className="text-[10px] h-5 px-1.5">
                          Masuk · {namaKategori(entry.category)}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <span
                    className={cn(
                      "text-sm font-bold tabular-nums shrink-0",
                      isOut ? "text-destructive" : "text-success"
                    )}
                  >
                    {isOut ? "-" : "+"}{formatRupiah(entry.amount)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>

      {/* Category Summary (OUT only) */}
      {data.categorySummary.length > 0 && (
        <SectionCard icon={Receipt} title="Rincian Pengeluaran per Kategori" tone="info">
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
                  <span className="text-sm font-bold tabular-nums text-destructive">
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
