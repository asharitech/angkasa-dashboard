import Link from "next/link";
import { getLedger, getLedgerByCode, getSewaHistory, getSewaDanaUsage } from "@/lib/data";
import { getSession } from "@/lib/auth";
import { formatRupiah, formatDateShort, formatDateRange } from "@/lib/format";
import { formatRequestorName } from "@/lib/names";
import { currentWitaMonth } from "@/lib/periods";
import { cn } from "@/lib/utils";
import { History, Download, Plus, Check } from "lucide-react";
import type { SewaLocation } from "@/lib/types";
import { SewaLocationEditButton } from "@/components/sewa-location-editor";
import { PageHeader } from "@/components/page-header";
import { ToneBadge } from "@/components/tone-badge";
import { SummaryStrip, SummaryCell } from "@/components/summary-strip";

export const dynamic = "force-dynamic";

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
  searchParams: Promise<{ tahap?: string }>;
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
    return <main className="content"><div className="p-8 text-center">Data sewa belum tersedia.</div></main>;
  }

  const { sewa } = ledger;
  const byRegion = new Map<string, typeof sewa.locations>();
  for (const loc of sewa.locations) {
    // Attempt to merge with reference data
    const ref = LOCATION_REFERENCE.find((r) => r.code === loc.code);
    const region = loc.region || ref?.region || "Lainnya";
    
    if (!byRegion.has(region)) byRegion.set(region, []);
    byRegion.get(region)!.push({ ...loc, region });
  }

  const activeCount = sewa.locations.filter((l) => l.status === "active").length;
  
  // Pipeline metrics
  let totalMasuk = 0;
  let totalPerantara = 0;
  let totalBelum = 0;
  
  sewa.locations.forEach(loc => {
    const amt = loc.pipeline?.expected_amount ?? loc.amount ?? 0;
    if (loc.pipeline?.stage === "tercatat") {
      totalMasuk += amt;
    } else if (loc.pipeline?.stage === "transfer_yayasan" || loc.pipeline?.stage === "di_intermediate") {
      totalPerantara += amt;
    } else {
      totalBelum += amt;
    }
  });

  const percentMasuk = sewa.total > 0 ? (totalMasuk / sewa.total) * 100 : 0;
  const percentPerantara = sewa.total > 0 ? (totalPerantara / sewa.total) * 100 : 0;
  const percentBelum = sewa.total > 0 ? (totalBelum / sewa.total) * 100 : 0;

  return (
    <main className="content" data-screen-label="04 Sewa Dapur">
      <PageHeader 
        eyebrow="Yayasan YRBB · Dapur Partner Payments"
        title="Sewa Dapur"
        subtitle={`11 lokasi · ${byRegion.size} wilayah · Multi-step transfer pipeline via perantara`}
      >
        <button className="btn btn--secondary"><History className="btn__icon"/> Riwayat tahap</button>
        <button className="btn btn--secondary"><Download className="btn__icon"/> Export</button>
        {canEdit && <button className="btn btn--primary"><Plus className="btn__icon"/> Mulai tahap baru</button>}
      </PageHeader>

      {/* Tahap selector */}
      <div className="tahap-bar">
        {sewaHistory.slice().reverse().map((h, i) => {
          const code = h.period_code ?? h.period;
          const isActive = code === activeTahap;
          const isLunas = !h.is_current;
          return (
            <Link href={h.is_current ? "/sewa" : `/sewa?tahap=${encodeURIComponent(code)}`} key={code} className={cn("tahap", isActive && "is-active")}>
              <div className="tahap__num">T · {String(i + 1).padStart(2, "0")} {isActive && "· AKTIF"}</div>
              <div className="tahap__name">{code}</div>
              <div className="tahap__meta">{formatDateRange(h.period)} · {isLunas ? "Lunas" : "Berjalan"}</div>
            </Link>
          );
        })}
      </div>

      {/* Summary */}
      <SummaryStrip variant="sewa">
        <SummaryCell 
          variant="sewa"
          label={`Target ${activeTahap}`} 
          value={formatRupiah(sewa.total)} 
          valueClassName="ss-cell__value--hero"
          subtext={`${activeCount} lokasi aktif · rata-rata ${formatRupiah(Math.round(sewa.total / Math.max(1, activeCount)))}/lokasi`} 
        />
        <SummaryCell 
          variant="sewa"
          label="Sudah sampai Yayasan" 
          value={formatRupiah(totalMasuk)} 
          valueClassName="text-pos-700"
          subtext={`${sewa.locations.filter(l => l.pipeline?.stage === "tercatat").length} lokasi · ${percentMasuk.toFixed(1)}%`} 
          progress={percentMasuk}
          progressTone="pos"
        />
        <SummaryCell 
          variant="sewa"
          label="Di perantara" 
          value={formatRupiah(totalPerantara)} 
          valueClassName="text-warn-700"
          subtext={`${sewa.locations.filter(l => l.pipeline?.stage === "transfer_yayasan" || l.pipeline?.stage === "di_intermediate").length} lokasi · belum masuk BTN`} 
          progress={percentPerantara}
          progressTone="warn"
        />
        <SummaryCell 
          variant="sewa"
          label="Belum diterima" 
          value={formatRupiah(totalBelum)} 
          valueClassName="text-neg-700"
          subtext={`${sewa.locations.filter(l => l.pipeline?.stage === "belum_diterima" || !l.pipeline?.stage).length} lokasi · action required`} 
          progress={percentBelum}
          progressTone="neg"
        />
      </SummaryStrip>

      {/* Regions */}
      {Array.from(byRegion.entries()).map(([region, locations]) => {
        const regionTotal = locations.reduce((s, l) => s + (l.amount ?? 0), 0);
        const regionReceived = locations.reduce((s, l) => s + (l.pipeline?.stage === "tercatat" ? (l.amount ?? 0) : 0), 0);
        const lunasCount = locations.filter(l => l.pipeline?.stage === "tercatat").length;
        const pendingCount = locations.filter(l => l.pipeline?.stage && l.pipeline.stage !== "tercatat").length;
        
        let markBg = "var(--ink-300)";
        if (region === "TOPILAUT") markBg = "var(--accent-700)";
        else if (region === "Rangas Beach") markBg = "var(--info-500)";
        else if (region === "ANGKASA") markBg = "var(--ink-000)";

        return (
          <div className="region" key={region}>
            <div className="region__head">
              <div className="region__mark" style={{ background: markBg }}></div>
              <div>
                <div className="region__name">{region}</div>
                <div className="region__count">{locations.length} lokasi</div>
              </div>
              <div className="pipe-legend">
                <span><span className="dot" style={{ background: "var(--pos-500)" }}></span>Yayasan</span>
                <span><span className="dot" style={{ background: "var(--warn-500)" }}></span>Perantara</span>
                <span><span className="dot" style={{ background: "var(--neg-500)" }}></span>Belum</span>
              </div>
              {pendingCount > 0 ? (
                <ToneBadge tone="warn">{pendingCount} pending</ToneBadge>
              ) : (
                <ToneBadge tone="pos">Selesai</ToneBadge>
              )}
              <span className="region__count mono" style={{ fontWeight: 600, color: "var(--ink-000)" }}>{formatRupiah(regionTotal)}</span>
            </div>

            <div className="loc-row loc-row--header">
              <div></div>
              <div>Lokasi</div>
              <div>Pemilik · Referensi</div>
              <div>Pipeline status</div>
              <div style={{ textAlign: "right" }}>Jumlah</div>
              <div style={{ textAlign: "right" }}>Tanggal</div>
              <div></div>
            </div>

            {locations.map((loc) => {
              const ref = LOCATION_REFERENCE.find((r) => r.code === loc.code);
              const stage = loc.pipeline?.stage;
              const isDone = stage === "tercatat";
              const isIntermediate = stage === "di_intermediate" || stage === "transfer_yayasan";
              const isPending = stage === "belum_diterima" || !stage;
              
              let iconBg = "var(--ink-050)";
              let iconColor = "var(--ink-500)";
              if (region === "TOPILAUT") { iconBg = "var(--accent-050)"; iconColor = "var(--accent-700)"; }
              else if (region === "Rangas Beach") { iconBg = "var(--info-050)"; iconColor = "var(--info-700)"; }
              
              if (isPending) { iconBg = "var(--neg-050)"; iconColor = "var(--neg-700)"; }

              return (
                <div className="loc-row" key={loc.code}>
                  <div className="loc-row__icon" style={{ background: iconBg, color: iconColor }}>
                    <Check className="w-3.5 h-3.5" strokeWidth={3} />
                  </div>
                  <div className="loc-row__code">{loc.code}</div>
                  <div className="loc-row__owner">
                    <span className="loc-row__owner-name">{ref?.holder || "—"}</span>
                    <span className="loc-row__owner-ref">SWA-{ref?.bgn || loc.code}</span>
                  </div>
                  <div className="loc-row__flow">
                    <span className={cn("flow-step", isDone && "is-done", isIntermediate && "is-current", isPending && "")}>Admin</span>
                    <span className="flow-arrow">→</span>
                    {region !== "ANGKASA" && (
                      <>
                        <span className={cn("flow-step", isDone && "is-done", isIntermediate && "is-current", isPending && "")}>{ref?.holder?.split(" ")[0] || "Perantara"}</span>
                        <span className="flow-arrow">→</span>
                      </>
                    )}
                    <span className={cn("flow-step", isDone && "is-done")}>Yayasan</span>
                  </div>
                  <div className={cn("loc-row__amount", isDone ? "text-pos" : isIntermediate ? "text-warn" : "text-neg")}>
                    {formatRupiah(loc.amount || 0)}
                  </div>
                  <div className="loc-row__date">{loc.pipeline?.received_at ? formatDateShort(loc.pipeline.received_at) : "—"}</div>
                  <div className="loc-row__action">
                    {isDone ? (
                      <ToneBadge tone="pos">Lunas</ToneBadge>
                    ) : (
                      <SewaLocationEditButton location={loc} />
                    )}
                  </div>
                </div>
              );
            })}

            <div className="region__subtotal">
              <span className="region__subtotal-label">Subtotal {region} · {lunasCount} lunas / {locations.length}</span>
              <span className="region__subtotal-value">{formatRupiah(regionTotal)}</span>
              <span style={{ gridColumn: "6/8", textAlign: "right", fontFamily: "var(--font-mono)", color: "var(--ink-300)" }}>{formatRupiah(regionReceived)} diterima</span>
            </div>
          </div>
        );
      })}

      {/* Grand total */}
      <div className="grand-total">
        <div>
          <div className="grand-total__label">Total {activeTahap}</div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ink-400)", marginTop: 4 }}>{byRegion.size} wilayah · {sewa.locations.length} lokasi</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div className="grand-total__label">Target</div>
          <div className="grand-total__fig">{formatRupiah(sewa.total)}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div className="grand-total__label">Diterima</div>
          <div className="grand-total__fig text-pos">{formatRupiah(totalMasuk)}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div className="grand-total__label">Outstanding</div>
          <div className="grand-total__fig grand-total__fig--hero text-neg">{formatRupiah(sewa.total - totalMasuk)}</div>
        </div>
      </div>

    </main>
  );
}
