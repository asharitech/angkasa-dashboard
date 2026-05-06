import Link from "next/link";
import { getLedger, getLedgerByCode, getSewaHistory, getSewaDanaUsage, getAccounts } from "@/lib/dal";
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
import { EntryRowActions } from "@/components/entry-row-actions";
import { Badge } from "@/components/ui/badge";
import { toneVariant, type Tone } from "@/lib/colors";
import { cn, idString } from "@/lib/utils";
import { getSewaStageMeta, getRegionTone, SEWA_LOCATION_REFS, type SewaLocationRef } from "@/lib/sewa-meta";
import { DashboardPageShell } from "@/components/layout/dashboard-page-shell";
import { PageToolbar } from "@/components/layout/page-toolbar";
import { DataTable, type DataTableColumn } from "@/components/data-table";
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

const SEWA_REF_COLUMNS: DataTableColumn<SewaLocationRef>[] = [
  {
    key: "code",
    header: "Kode DB",
    cell: (l) => <span className="font-semibold">{l.code}</span>,
  },
  {
    key: "bgn",
    header: "BGN",
    cell: (l) => <span className="text-muted-foreground">{l.bgn}</span>,
  },
  { key: "name", header: "Nama", cell: (l) => l.name },
  {
    key: "region",
    header: "Region",
    cell: (l) => <span className="text-muted-foreground">{l.region}</span>,
  },
  {
    key: "holder",
    header: "Via",
    nowrap: false,
    cell: (l) => <span className="text-muted-foreground">{l.holder}</span>,
  },
];

export default async function SewaPage({
  searchParams,
}: {
  searchParams: Promise<{ tahap?: string; view?: string }>;
}) {
  const { tahap } = await searchParams;
  const [requestedLedger, currentLedger, sewaHistory, session, accounts] = await Promise.all([
    tahap ? getLedgerByCode("sewa", tahap) : getLedger("sewa"),
    getLedger("sewa"),
    getSewaHistory(),
    getSession(),
    getAccounts(),
  ]);
  const ledger = requestedLedger ?? currentLedger;
  const activeTahap = ledger?.period_code ?? ledger?.period;
  const danaSewa = await getSewaDanaUsage(activeTahap ?? undefined);
  const isHistorical = !!tahap && ledger?.period_code !== currentLedger?.period_code;
  const canEdit = session?.role === "admin" && !isHistorical;

  if (!ledger?.sewa) {
    return (
      <DashboardPageShell>
        <PageHeader icon={Building2} title="Sewa Dapur" />
        <EmptyState
          icon={Inbox}
          title="Data sewa belum tersedia"
          description="Belum ada ledger sewa di-publish."
        />
      </DashboardPageShell>
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
    <DashboardPageShell>
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

      {sewaHistory.length > 1 && (
        <PageToolbar>
          <FilterTabs tabs={tahapTabs} />
        </PageToolbar>
      )}

      <KpiStrip items={kpis} cols={3} />

      <SewaTabs
        lokasi={
          <div className="space-y-4">
            {Array.from(byRegion.entries()).map(([region, locations]) => {
              const regionTotal = locations.reduce((s, l) => s + (l.amount ?? 0), 0);
              const tone = getRegionTone(region);
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
                      const stage = loc.pipeline?.stage ? getSewaStageMeta(loc.pipeline.stage) : null;
                      const ref = SEWA_LOCATION_REFS.find((r) => r.code === loc.code);
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
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="text-right">
                          <p className="text-sm font-semibold text-destructive tabular-nums">
                            −{formatRupiah(e.amount)}
                          </p>
                          <p className="text-xs text-muted-foreground">{formatDateShort(e.date)}</p>
                        </div>
                        <EntryRowActions entryId={idString(e._id)} accounts={accounts} />
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
            <DataTable<SewaLocationRef>
              bleedMobile={false}
              minWidth={560}
              rows={SEWA_LOCATION_REFS}
              rowKey={(l) => l.code}
              columns={SEWA_REF_COLUMNS}
            />
          </SectionCard>
        }
      />
    </DashboardPageShell>
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

