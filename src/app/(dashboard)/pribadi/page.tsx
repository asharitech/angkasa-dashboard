import { getPengeluaranAngkasa } from "@/lib/data";
import { formatRupiah, formatDateShort } from "@/lib/format";
import { idString } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { SectionCard } from "@/components/section-card";
import { Wallet, Receipt, CalendarDays, Tag } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

// 6 label yang diminta Pak Angkasa
const LABEL_ORDER = [
  "makan_minum",
  "grab_gojek",
  "belanja",
  "top_up",
  "pulsa",
  "lainnya",
] as const;

type LabelKey = typeof LABEL_ORDER[number];

const LABEL_CONFIG: Record<
  LabelKey,
  { label: string; color: Parameters<typeof Badge>[0]["variant"] }
> = {
  makan_minum: { label: "Makan / Minum", color: "warning" },
  grab_gojek: { label: "Grab / Gojek", color: "info" },
  belanja: { label: "Belanja", color: "default" },
  top_up: { label: "Top Up", color: "success" },
  pulsa: { label: "Pulsa", color: "secondary" },
  lainnya: { label: "Lainnya", color: "outline" },
};

function getLabel(entry: { category: string | null; description: string }): LabelKey {
  const desc = (entry.description ?? "").toLowerCase();
  const cat = entry.category ?? "";

  if (desc.includes("grab") || desc.includes("gojek")) return "grab_gojek";
  if (desc.includes("top up") || desc.includes("topup") || desc.includes("shopeepay") || desc.includes("ovo") || desc.includes("gopay") || desc.includes("dana"))
    return "top_up";
  if (cat === "pulsa") return "pulsa";
  if (cat === "makan") return "makan_minum";
  if (cat === "belanja" || cat === "gym") return "belanja";

  return "lainnya";
}

function getNamaBulan(monthCode: string): string {
  const [year, month] = monthCode.split("-");
  const names = ["", "Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  const m = parseInt(month, 10);
  return `${names[m] ?? month} ${year}`;
}

export default async function PribadiPage({
  searchParams,
}: {
  searchParams: Promise<{ bulan?: string; label?: string }>;
}) {
  const params = await searchParams;
  const data = await getPengeluaranAngkasa(params.bulan);
  const activeMonth = params.bulan ?? data.months[0] ?? "";
  const activeLabel = (params.label as LabelKey | undefined) ?? undefined;

  // Compute label totals for OUT entries
  const labelTotals = new Map<LabelKey, { total: number; count: number }>();
  for (const key of LABEL_ORDER) {
    labelTotals.set(key, { total: 0, count: 0 });
  }
  for (const e of data.entriesOut) {
    const key = getLabel(e);
    const cur = labelTotals.get(key) ?? { total: 0, count: 0 };
    cur.total += e.amount;
    cur.count += 1;
    labelTotals.set(key, cur);
  }

  // Filtered entries
  const filteredEntries = activeLabel
    ? data.entries.filter((e) => e.direction === "out" && getLabel(e) === activeLabel)
    : data.entries.filter((e) => e.direction === "out");

  const totalOut = data.entriesOut.reduce((s, e) => s + e.amount, 0);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-bold tracking-tight md:text-2xl flex items-center gap-2">
          <Wallet className="h-6 w-6 text-primary shrink-0" />
          Pengeluaran Angkasa
        </h2>
      </div>

      {/* Month List */}
      {data.months.length > 0 && (
        <div className="space-y-2">
          {data.months.map((m) => {
            const active = m === activeMonth;
            const cfMonth = (data.cashflowByMonth as Record<string, { in: number; out: number }>)[m] ?? { in: 0, out: 0 };
            return (
              <Link
                key={m}
                href={`/pribadi?bulan=${m}${activeLabel ? `&label=${activeLabel}` : ""}`}
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
                    {cfMonth.in - cfMonth.out >= 0 ? "+" : ""}{formatRupiah(cfMonth.in - cfMonth.out)}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Total Card */}
      <SectionCard title={`Total Pengeluaran — ${getNamaBulan(activeMonth)}`} tone="danger" bodyClassName="py-3">
        <p className="text-2xl font-extrabold tabular-nums text-destructive">
          {formatRupiah(totalOut)}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {data.entriesOut.length} transaksi
        </p>
      </SectionCard>

      {/* Label Filters */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Tag className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">Label Pengeluaran</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/pribadi?bulan=${activeMonth}`}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all border",
              !activeLabel
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background text-muted-foreground border-border hover:border-primary/50"
            )}
          >
            Semua
          </Link>
          {LABEL_ORDER.map((key) => {
            const config = LABEL_CONFIG[key];
            const { total, count } = labelTotals.get(key) ?? { total: 0, count: 0 };
            if (total === 0) return null;
            const active = activeLabel === key;
            return (
              <Link
                key={key}
                href={`/pribadi?bulan=${activeMonth}&label=${key}`}
                className={cn(
                  "rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all border flex items-center gap-1.5",
                  active
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-muted-foreground border-border hover:border-primary/50"
                )}
              >
                {config.label}
                <span className={cn("tabular-nums", active ? "text-primary-foreground/70" : "text-muted-foreground/60")}>
                  {formatRupiah(total).replace("Rp", "").trim()}
                </span>
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
              const labelKey = getLabel(entry);
              const labelConfig = LABEL_CONFIG[labelKey];
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
                      <Badge variant={labelConfig.color} className="text-[10px] h-5 px-1.5">
                        {labelConfig.label}
                      </Badge>
                    </div>
                  </div>
                  <span className="text-sm font-bold tabular-nums shrink-0 text-destructive">
                    -{formatRupiah(entry.amount)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>

      {/* Label Summary */}
      <SectionCard icon={Receipt} title="Rincian per Label" tone="info">
        <div className="divide-y divide-border/50">
          {LABEL_ORDER.map((key) => {
            const config = LABEL_CONFIG[key];
            const { total, count } = labelTotals.get(key) ?? { total: 0, count: 0 };
            if (total === 0) return null;
            const isActive = !activeLabel || activeLabel === key;
            return (
              <div
                key={key}
                className={cn(
                  "flex items-center justify-between py-2.5",
                  !isActive && "opacity-40"
                )}
              >
                <div className="flex items-center gap-2">
                  <Badge variant={config.color} className="text-[10px] h-5 px-1.5">
                    {config.label}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{count}x</span>
                </div>
                <span className="text-sm font-bold tabular-nums text-destructive">
                  {formatRupiah(total)}
                </span>
              </div>
            );
          })}
        </div>
      </SectionCard>
    </div>
  );
}
