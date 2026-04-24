import Link from "next/link";
import { getLedger, getLedgerByCode, getSewaHistory, getSewaDanaUsage } from "@/lib/data";
import { getSession } from "@/lib/auth";
import { formatRupiah, formatDateShort, formatDateRange } from "@/lib/format";
import { formatRequestorName } from "@/lib/names";
import { PageHeader } from "@/components/page-header";
import { KpiStrip, type KpiItem } from "@/components/kpi-strip";
import { SectionCard } from "@/components/section-card";
import { EmptyState } from "@/components/empty-state";
import { FilterTabs, type FilterTab } from "@/components/filter-bar";
import { SewaTabs } from "@/components/sewa-tabs";
import { StatusBadge } from "@/components/status-badge";
import { SewaLocationEditButton } from "@/components/sewa-location-editor";
import { Badge } from "@/components/ui/badge";
import { toneVariant, type Tone } from "@/lib/colors";
import { cn, idString } from "@/lib/utils";
import {
  Building2,
  MapPin,
  Calendar,
  DollarSign,
  StickyNote,
  History,
  ArrowUpRight,
  Wallet,
  BookOpen,
  AlertTriangle,
  Inbox,
} from "lucide-react";

export const dynamic = "force-dynamic";

const regionAccent: Record<string, Tone> = {
  TOPILAUT: "info",
  "Rangas Beach": "warning",
  ANGKASA: "success",
};

const stageMap: Record<string, { label: string; tone: Tone }> = {
  belum_diterima: { label: "Belum Diterima", tone: "danger" },
  di_intermediate: { label: "Di Intermediate", tone: "warning" },
  transfer_yayasan: { label: "Transfer ke Yayasan", tone: "info" },
  tercatat: { label: "Tercatat", tone: "success" },
};

const LOCATION_REFERENCE: { code: string; bgn: string; name: string; region: string; holder: string }[] = [
  { code: "SIMBORO", bgn: "RB", name: "Simboro", region: "TOPILAUT", holder: "Patta Wellang" },
  { code: "DIPO", bgn: "DP", name: "Dipo", region: "TOPILAUT", holder: "Patta Wellang" },
  { code: "KURBAS", bgn: "KB", name: "Kurbas", region: "TOPILAUT", holder: "Patta Wellang" },
  { code: "TAPALANG", bgn: "TPL", name: "Tapalang", region: "TOPILAUT", holder: "Patta Wellang" },
  { code: "KENJE", bgn: "CL", name: "Kenje", region: "TOPILAUT", holder: "Patta Wellang" },
  { code: "SARUDU", bgn: "SRD", name: "Sarudu", region: "Rangas Beach", holder: "Pak Sandi" },
  { code: "BUDONG_BUDONG", bgn: "BDG", name: "Budong-Budong", region: "Rangas Beach", holder: "Pak Sandi" },
  { code: "SAMPAGA", bgn: "SPG", name: "Sampaga", region: "Rangas Beach", holder: "Pak Sandi" },
  { code: "KAROSSA", bgn: "KRS", name: "Karossa", region: "Rangas Beach", holder: "Pak Sandi" },
  { code: "LARA", bgn: "LR", name: "Lara", region: "ANGKASA", holder: "—" },
  { code: "SUMARE", bgn: "SMR", name: "Sumare", region: "ANGKASA", holder: "—" },
];

export default async function SewaPage({
  searchParams,
}: {
  searchParams: Promise<{ tahap?: string; view?: string }>;
}) {
  const { tahap } = await searchParams;
  const [requestedLedger, currentLedger, sewaHistory, session] = await Promise.all([
    tahap ? getLedgerByCode("sewa", tahap) : getLedger("sewa"),
    getLedger("sewa"),
    getSewaHistory(),
    getSession(),
  ]);
  const ledger = requestedLedger ?? currentLedger;
  const activeTahap = ledger?.period_code ?? ledger?.period;
  const danaSewa = await getSewaDanaUsage(activeTahap ?? undefined);
  const isHistorical = !!tahap && ledger?.period_code !== currentLedger?.period_code;
  const canEdit = session?.role === "admin" && !isHistorical;

  if (!ledger?.sewa) {
    return (
      <div className="space-y-5">
        <PageHeader icon={Building2} title="Sewa Dapur" />
        <EmptyState
          icon={Inbox}
          title="Data sewa belum tersedia"
          description="Belum ada ledger sewa di-publish."
        />
      </div>
    );
  }

  const { sewa } = ledger;
  const byRegion = new Map<string, typeof sewa.locations>();
  for (const loc of sewa.locations) {
    if (!byRegion.has(loc.region)) byRegion.set(loc.region, []);
    byRegion.get(loc.region)!.push(loc);
  }

  const activeCount = sewa.locations.filter((l) => l.status === "active").length;
  const sisaPct =
    danaSewa.totalMasuk > 0 ? Math.round((danaSewa.sisaDana / danaSewa.totalMasuk) * 100) : 100;

  const kpis: KpiItem[] = [
    {
      label: "Total Sewa",
      value: formatRupiah(sewa.total),
      icon: DollarSign,
      tone: "success",
    },
    {
      label: "Lokasi Aktif",
      value: `${activeCount}/${sewa.locations.length}`,
      icon: MapPin,
      tone: "info",
    },
    {
      label: "Rate/Hari",
      value: formatRupiah(sewa.rate_per_day),
      icon: Calendar,
      tone: "primary",
    },
  ];

  const tahapTabs: FilterTab[] = sewaHistory.map((h) => {
    const code = h.period_code ?? h.period;
    return {
      label: code,
      href: h.is_current ? "/sewa" : `/sewa?tahap=${encodeURIComponent(code)}`,
      active: code === activeTahap,
    };
  });

return (
    <div className="space-y-5">
      <PageHeader icon={Building2} title="Sewa Dapur">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="font-semibold">
            {ledger.period_code ?? formatDateRange(ledger.period)}
          </Badge>
          {isHistorical && (
            <Link href="/sewa" className="text-xs text-muted-foreground underline hover:text-foreground">
              ← aktif
            </Link>
          )}
        </div>
      </PageHeader>

      {sewaHistory.length > 1 && <FilterTabs tabs={tahapTabs} />}

      <KpiStrip items={kpis} cols={3} />

      <SewaTabs
        lokasi={
          <div className="space-y-4">
            {Array.from(byRegion.entries()).map(([region, locations]) => {
              const regionTotal = locations.reduce((s, l) => s + (l.amount ?? 0), 0);
              const tone = regionAccent[region] ?? "neutral";
              return (
                <SectionCard
                  key={region}
                  title={region}
                  tone={tone}
                  badge={
                    <span className="ml-1 text-xs text-muted-foreground tabular-nums">
                      {formatRupiah(regionTotal)} · {locations.length} lokasi
                    </span>
                  }
                >
                  <div className="divide-y divide-border/60">
                    {locations.map((loc) => {
                      const stage = loc.pipeline?.stage ? stageMap[loc.pipeline.stage] : null;
                      const ref = LOCATION_REFERENCE.find((r) => r.code === loc.code);
                      const regionMismatch = ref && ref.region !== loc.region;
                      return (
                        <div
                          key={loc.code}
                          className="flex items-center justify-between gap-3 py-2.5"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold">{loc.code}</p>
                            <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                              {loc.days != null && loc.days > 0 && (
                                <span className="tabular-nums">
                                  {loc.days}h · {formatRupiah(loc.amount ?? 0)}
                                </span>
                              )}
                              {loc.pipeline?.holder && (
                                <span className="truncate">
                                  via {formatRequestorName(loc.pipeline.holder)}
                                </span>
                              )}
                            </div>
                            {regionMismatch && ref && (
                              <p className="mt-0.5 flex items-center gap-1 text-xs text-warning">
                                <AlertTriangle className="h-3 w-3" />
                                ref: {ref.name} / {ref.region}
                              </p>
                            )}
                          </div>
                          <div className="flex shrink-0 items-center gap-1">
                            {stage ? (
                              <Badge variant={toneVariant(stage.tone)} className="text-xs">{stage.label}</Badge>
                            ) : (
                              <StatusBadge status={loc.status} size="sm" />
                            )}
                            {canEdit && <SewaLocationEditButton location={loc} />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </SectionCard>
              );
            })}
          </div>
        }
        operasional={
          <div className="space-y-4">
            <SectionCard icon={Wallet} title="Dana Operasional dari Sewa" tone="warning">
              <div className="grid grid-cols-3 gap-2">
                <MoneyTile label="Masuk" value={danaSewa.totalMasuk} tone="success" />
                <MoneyTile label="Terpakai" value={danaSewa.totalTerpakai} tone="danger" />
                <MoneyTile
                  label={`Sisa (${sisaPct}%)`}
                  value={danaSewa.sisaDana}
                  tone="info"
                />
              </div>
              {danaSewa.totalMasuk > 0 && (
                <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-2 rounded-full bg-destructive transition-all opacity-80"
                    style={{
                      width: `${Math.min(100, Math.round((danaSewa.totalTerpakai / danaSewa.totalMasuk) * 100))}%`,
                    }}
                  />
                </div>
              )}
            </SectionCard>

            <SectionCard
              icon={ArrowUpRight}
              title="Pengeluaran dari Dana Sewa"
              tone="danger"
              badge={
                <Badge variant="destructive" className="ml-1 tabular-nums">
                  {danaSewa.pengeluaranSewa.length} item
                </Badge>
              }
            >
              {danaSewa.pengeluaranSewa.length === 0 ? (
                <EmptyState
                  icon={Inbox}
                  title="Belum ada pengeluaran"
                  description="Dana sewa belum dipakai untuk operasional."
                  className="border-none shadow-none"
                />
              ) : (
                <div className="divide-y divide-border/60">
                  {danaSewa.pengeluaranSewa.map((e) => (
                    <div
                      key={idString(e._id)}
                      className="flex items-center justify-between gap-3 py-2.5"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{e.counterparty}</p>
                        <p className="truncate text-xs text-muted-foreground">{e.description}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-semibold text-destructive tabular-nums">
                          −{formatRupiah(e.amount)}
                        </p>
                        <p className="text-xs text-muted-foreground">{formatDateShort(e.date)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>

            {sewa.notes && Object.keys(sewa.notes).length > 0 && (
              <SectionCard icon={StickyNote} title="Catatan">
                <div className="space-y-1.5 text-sm">
                  {Object.entries(sewa.notes).map(([key, val]) => (
                    <p key={key} className="text-muted-foreground">
                      <span className="font-semibold capitalize text-foreground">{key}:</span> {val}
                    </p>
                  ))}
                </div>
              </SectionCard>
            )}
          </div>
        }
        riwayat={
          <SectionCard icon={History} title="Riwayat Tahap">
            {sewaHistory.length <= 1 ? (
              <EmptyState
                icon={Inbox}
                title="Belum ada riwayat"
                description="Hanya tahap aktif yang tercatat."
                className="border-none shadow-none"
              />
            ) : (
              <div className="divide-y divide-border/60">
                {sewaHistory.map((h) => {
                  const code = h.period_code ?? h.period;
                  const href = h.is_current ? "/sewa" : `/sewa?tahap=${encodeURIComponent(code)}`;
                  const isActive = code === activeTahap;
                  return (
                    <Link
                      key={idString(h._id)}
                      href={href}
                      className={cn(
                        "flex items-center justify-between px-2 py-2.5 transition-colors -mx-2 rounded-md",
                        isActive
                          ? "bg-primary/10"
                          : "hover:bg-accent",
                      )}
                    >
                      <div>
                        <p className="text-sm font-semibold">
                          {code}
                          {h.is_current && (
                            <Badge variant="secondary" className="ml-2 text-xs">
                              aktif
                            </Badge>
                          )}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {formatDateRange(h.period)} · update {formatDateShort(h.updated_at)}
                        </p>
                      </div>
                      <span className="text-sm font-bold tabular-nums">
                        {formatRupiah(h.sewa?.total ?? 0)}
                      </span>
                    </Link>
                  );
                })}
              </div>
            )}
          </SectionCard>
        }
        referensi={
          <SectionCard icon={BookOpen} title="Referensi Kode Lokasi" bodyClassName="px-0 md:px-4">
            <div className="-mx-4 overflow-x-auto md:mx-0">
              <table className="w-full text-sm" style={{ minWidth: "560px" }}>
                <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">Kode DB</th>
                    <th className="px-3 py-2 text-left font-medium">BGN</th>
                    <th className="px-3 py-2 text-left font-medium">Nama</th>
                    <th className="px-3 py-2 text-left font-medium">Region</th>
                    <th className="px-3 py-2 text-left font-medium">Via</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {LOCATION_REFERENCE.map((l) => (
                    <tr key={l.code} className="hover:bg-muted/30">
                      <td className="px-3 py-2 font-semibold">{l.code}</td>
                      <td className="px-3 py-2 text-muted-foreground">{l.bgn}</td>
                      <td className="px-3 py-2">{l.name}</td>
                      <td className="px-3 py-2 text-muted-foreground">{l.region}</td>
                      <td className="px-3 py-2 text-muted-foreground">{l.holder}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>
        }
      />
    </div>
  );
}

function MoneyTile({ label, value, tone }: { label: string; value: number; tone: Tone }) {
  const colorMap: Record<Tone, string> = {
    success: "text-success",
    danger: "text-destructive",
    warning: "text-warning",
    info: "text-info",
    primary: "text-primary",
    neutral: "text-muted-foreground",
    muted: "text-muted-foreground",
  };
  return (
    <div className="text-center">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn("text-sm font-bold tabular-nums", colorMap[tone])}>{formatRupiah(value)}</p>
    </div>
  );
}

