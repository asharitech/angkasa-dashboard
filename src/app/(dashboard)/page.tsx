import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import {
  getDashboardSummary,
  getPendingTransfers,
  getDataIntegrityIssues,
  getLaporanOpReconciliation,
  getActivityFeed,
} from "@/lib/data";
import { getSession } from "@/lib/auth";
import { formatRupiah, formatDate, formatDateShort } from "@/lib/format";
import { cn } from "@/lib/utils";
import { formatRequestorName } from "@/lib/names";
import {
  Calendar,
  Download,
  Plus,
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [data, pendingTransfers, integrityIssues, recon, session, activities] = await Promise.all([
    getDashboardSummary(),
    getPendingTransfers(),
    getDataIntegrityIssues(),
    getLaporanOpReconciliation(),
    getSession(),
    getActivityFeed(6),
  ]);
  
  const isAdmin = session?.role === "admin";
  const errorCount = integrityIssues.filter((i) => i.severity === "error").length;
  const warnCount = integrityIssues.filter((i) => i.severity === "warn").length;

  const op = data.laporanOp?.laporan_op;
  const danaEfektif = op?.dana_efektif ?? 0;
  const saldo = op?.totals?.saldo ?? 0;
  const totalKewajiban = op?.kewajiban?.total ?? 0;
  const sewaTotal = data.sewa?.sewa?.total ?? 0;
  const sewaLocations = data.sewa?.sewa?.locations ?? [];
  const activeCount = sewaLocations.filter((l) => l.status === "active").length;
  const cashSisa = data.cashYayasan.sisa;

  const healthRatio = saldo > 0 ? danaEfektif / saldo : 0;
  const health = (() => {
    if (healthRatio >= 0.8) return { label: "Sangat Sehat", tone: "pos" };
    if (healthRatio >= 0.5) return { label: "Sehat", tone: "pos" };
    if (healthRatio >= 0.2) return { label: "Perhatian", tone: "warn" };
    return { label: "Berisiko", tone: "neg" };
  })();

  const asOf = data.laporanOp?.as_of;
  const updatedAt = data.laporanOp?.updated_at;
  const displayDate = (() => {
    if (!asOf) return updatedAt ?? null;
    if (!updatedAt) return asOf;
    return new Date(updatedAt) > new Date(asOf) ? updatedAt : asOf;
  })();

  const reconHasDiff = recon && (recon.diffMasuk !== 0 || recon.diffKeluar !== 0);
  const reconAmount = recon ? Math.abs(recon.diffMasuk) + Math.abs(recon.diffKeluar) : 0;

  const yayasanAccounts = data.accounts.filter((a) => a.type === "yayasan");
  const pribadiAccounts = data.accounts.filter((a) => a.type === "pribadi" || a.type === "mixed");
  
  // Combine accounts to match the 4-grid layout (Yayasan BTN, Cash, BCA, BRI)
  const displayAccounts = [
    yayasanAccounts[0], 
    { _id: 'cash', bank: 'Cash Yayasan', type: 'Cash', balance: cashSisa, holder: `Terpakai bulan ini ${formatRupiah(data.cashYayasan.terpakai)}` },
    ...pribadiAccounts.slice(0, 2)
  ].filter(Boolean);

  const kewajiban = op?.kewajiban;
  const kewajibanRowsData = kewajiban ? Object.entries(kewajiban)
    .filter(([key, value]) => key !== "total" && value != null && typeof value === "number")
    .sort((a, b) => {
      // Prioritize tahap items, then alphabetical
      const isATahap = a[0].startsWith("dana_pinjam_angkasa_tahap");
      const isBTahap = b[0].startsWith("dana_pinjam_angkasa_tahap");
      if (isATahap && !isBTahap) return -1;
      if (!isATahap && isBTahap) return 1;
      if (isATahap && isBTahap) {
        const aNum = Number(a[0].match(/tahap(\d+)$/)?.[1] ?? 0);
        const bNum = Number(b[0].match(/tahap(\d+)$/)?.[1] ?? 0);
        return aNum - bNum;
      }
      return a[0].localeCompare(b[0]);
    })
    .map(([key, value]) => {
      let label = key;
      if (key.startsWith("dana_pinjam_angkasa_tahap")) {
        const num = key.match(/tahap(\d+)$/)?.[1] ?? "?";
        label = `Dana Pinjam Angkasa — Tahap ${num}`;
      } else if (key === "lembar2_btn") {
        label = "Lembar 2 BTN";
      } else if (key === "pinjaman_btn") {
        label = "Pinjaman BTN";
      } else {
        label = key.split("_").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
      }
      return { label, amount: value as number };
    }) : [];

  return (
    <main className="content" data-screen-label="01 Dashboard">
      <PageHeader 
        eyebrow="Yayasan YRBB · Operational Overview"
        title="Ringkasan"
        subtitle={displayDate ? `Updated ${formatDateShort(displayDate)}` : "Live Overview"}
      />

      {/* Hero: Dana Efektif */}
      <section className="hero">
        <div className="hero__main">
          <div className="hero__eyebrow">
            <span className="hero__eyebrow-mark"></span>
            Dana Efektif {displayDate ? `· per ${formatDateShort(displayDate)}` : ""}
          </div>
          <div className="hero__amount">
            <span className="hero__amount-sym">Rp</span>
            {danaEfektif.toLocaleString('id-ID')}
          </div>
          <div className="hero__formula">
            <span className="fig">{formatRupiah(saldo)}</span>
            <span className="op">saldo BTN</span>
            <span className="op">−</span>
            <span className="fig">{formatRupiah(totalKewajiban)}</span>
            <span className="op">total kewajiban</span>
          </div>
        </div>
        <div className="hero__side">
          <div>
            <div className="health">
              <span className={cn("health__dot", health.tone !== 'pos' && "bg-warn-500 shadow-none")}></span>
              <span className="health__label">{health.label}</span>
              <span className={cn("health__ratio", health.tone === 'neg' && "text-neg-700")}>
                {(healthRatio * 100).toFixed(1)}%
              </span>
            </div>
            <div style={{ marginTop: "var(--sp-3)" }}>
              <div className="ratio-bar">
                <div 
                  className={cn("ratio-bar__fill", health.tone === 'warn' && "bg-warn-500", health.tone === 'neg' && "bg-neg-500")} 
                  style={{ width: `${Math.min(100, healthRatio * 100)}%` }}
                ></div>
              </div>
              <div className="ratio-meta" style={{ marginTop: 6 }}>
                <span>Ratio dana efektif / saldo</span>
                <span>target ≥ 50%</span>
              </div>
            </div>
          </div>
          <div className="hero__side-meta">
            <div className="hero__side-meta-item">
              <div className="hero__side-meta-label">Cash Yayasan</div>
              <div className="hero__side-meta-value">{formatRupiah(cashSisa)}</div>
            </div>
            <div className="hero__side-meta-item">
              <div className="hero__side-meta-label">Dana Sewa (aktif)</div>
              <div className="hero__side-meta-value">{formatRupiah(sewaTotal)}</div>
            </div>
            <div className="hero__side-meta-item">
              <div className="hero__side-meta-label">Kewajiban Total</div>
              <div className="hero__side-meta-value">{formatRupiah(totalKewajiban)}</div>
            </div>
            <div className="hero__side-meta-item">
              <div className="hero__side-meta-label">Pengajuan pending</div>
              <div className="hero__side-meta-value">{data.pengajuanPending} item · {formatRupiah(data.pengajuanTotalAmount)}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Alert strip */}
      <div className="alerts">
        {reconHasDiff && (
          <div className="callout callout--warn">
            <AlertTriangle className="callout__icon" />
            <div style={{ flex: 1 }}>
              <div className="callout__title">Snapshot Laporan Op tidak sinkron dengan entries live</div>
              <div className="callout__body">
                Selisih ledger vs entries: <span className="num">{formatRupiah(reconAmount)}</span>
              </div>
            </div>
            <Link href="/laporan-op" className="btn btn--secondary btn--sm">Rekonsiliasi <ArrowRight className="w-3 h-3 ml-1"/></Link>
          </div>
        )}
        
        {(errorCount > 0 || warnCount > 0) && (
          <div className="callout callout--warn">
            <ShieldAlert className="callout__icon text-warn-700" />
            <div style={{ flex: 1 }}>
              <div className="callout__title">{errorCount + warnCount} Isu Integritas Data Ditemukan</div>
              <div className="callout__body">{errorCount} Error · {warnCount} Peringatan</div>
            </div>
            <Link href="/audit" className="btn btn--ghost btn--sm">Buka Audit Data <ArrowRight className="w-3 h-3 ml-1"/></Link>
          </div>
        )}

        {data.pengajuanPending > 0 && (
          <div className="callout">
            <AlertTriangle className="callout__icon" style={{ color: "var(--ink-000)" }} />
            <div style={{ flex: 1 }}>
              <div className="callout__title">{data.pengajuanPending} pengajuan menunggu penyelesaian · {formatRupiah(data.pengajuanTotalAmount)}</div>
              <div className="callout__body">
                {data.pengajuanByRequestor.map(r => `${formatRequestorName(r._id)} (${formatRupiah(r.total)})`).join(" · ")}
              </div>
            </div>
            <Link href="/pengajuan" className="btn btn--ghost btn--sm">Buka Pengajuan <ArrowRight className="w-3 h-3 ml-1"/></Link>
          </div>
        )}
      </div>

      {/* Accounts strip */}
      {displayAccounts.length > 0 && (
        <section className="section">
          <div className="section__head">
            <div className="row-flex">
              <h2 className="section__title">Rekening</h2>
              <span className="section__meta">{displayAccounts.length} akun</span>
            </div>
          </div>
          <div className="accounts-grid" style={{ gridTemplateColumns: `repeat(${Math.min(displayAccounts.length, 4)}, 1fr)`}}>
            {displayAccounts.map((acc: any, i: number) => (
              <div className="account" key={acc._id || i}>
                <div className="account__row">
                  <div className="account__bank">{acc.bank}</div>
                  <div className="account__type">{acc.type || "Rekening"}</div>
                </div>
                <div className="account__amount">{formatRupiah(acc.balance || 0)}</div>
                <div className="account__holder">
                  {acc.holder && String(acc.holder).includes("Terpakai") 
                    ? acc.holder 
                    : `a.n. ${formatRequestorName(acc.holder)}`}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Two-column: pipeline + kewajiban */}
      <section className="section">
        <div className="split-2">
          {/* Transfer pipeline */}
          <div>
            <div className="section__head">
              <div className="row-flex">
                <h2 className="section__title">Pipeline Transfer Masuk</h2>
                <span className="section__meta">{pendingTransfers.pending.length} lokasi · {formatRupiah(pendingTransfers.totalExpected)}</span>
              </div>
              <Link className="section__link" href="/sewa">Sewa <ArrowRight className="w-3 h-3 ml-1"/></Link>
            </div>
            <div className="pipe-list">
              {pendingTransfers.pending.length === 0 ? (
                <div className="p-4 text-center text-sm text-ink-500">Tidak ada transfer masuk yang tertunda.</div>
              ) : (
                pendingTransfers.pending.slice(0, 5).map((loc) => (
                  <div className="pipe-item" key={loc.code}>
                    <span className="pipe-code">{loc.code}</span>
                    <span className="pipe-via">via {formatRequestorName(loc.pipeline?.holder)}</span>
                    <span className="pipe-stage" style={{ color: "var(--warn-700)" }}>
                      <span className="pipe-stage__dot" style={{ background: "var(--warn-500)" }}></span>
                      Belum Diterima
                    </span>
                    <span className="pipe-amount">{formatRupiah(loc.pipeline?.expected_amount ?? loc.amount ?? 0)}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Kewajiban breakdown */}
          <div>
            <div className="section__head">
              <div className="row-flex">
                <h2 className="section__title">Kewajiban</h2>
                <span className="section__meta">Outstanding</span>
              </div>
              <Link className="section__link" href="/laporan-op">Detail <ArrowRight className="w-3 h-3 ml-1"/></Link>
            </div>
            <div className="kewajiban-list">
              {kewajibanRowsData.length === 0 ? (
                <div className="p-4 text-center text-sm text-ink-500">Tidak ada kewajiban.</div>
              ) : (
                <>
                  {kewajibanRowsData.map((row) => (
                    <div className="kewajiban-row" key={row.label}>
                      <span className="kewajiban-row__label">{row.label}</span>
                      <span className="kewajiban-row__share">{((row.amount / totalKewajiban) * 100).toFixed(1)}%</span>
                      <span className="kewajiban-row__amount">{formatRupiah(row.amount)}</span>
                    </div>
                  ))}
                  <div className="kewajiban-total">
                    <span className="kewajiban-total__label">Total Kewajiban</span>
                    <span>{formatRupiah(totalKewajiban)}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Sewa locations */}
      <section className="section">
        <div className="section__head">
          <div className="row-flex">
            <h2 className="section__title">Sewa Dapur</h2>
            <span className="badge badge--outline">
              <span className="badge__dot" style={{ color: "var(--pos-500)" }}></span>
              {activeCount}/{sewaLocations.length} aktif
            </span>
            <span className="section__meta">{formatRupiah(sewaTotal)}</span>
          </div>
          <Link className="section__link" href="/sewa">Buka Sewa <ArrowRight className="w-3 h-3 ml-1"/></Link>
        </div>
        <div className="sewa-grid">
          {/* Group into regions if possible. The dashboard code didn't have regions, so we will just spread them evenly into 3 columns */}
          {[0, 1, 2].map((colIndex) => {
            const itemsPerCol = Math.ceil(sewaLocations.length / 3);
            const items = sewaLocations.slice(colIndex * itemsPerCol, (colIndex + 1) * itemsPerCol);
            if (items.length === 0) return null;
            
            return (
              <div className="sewa-region" key={colIndex}>
                <div className="sewa-region__head">
                  <span className="sewa-region__name">Lokasi {colIndex + 1}</span>
                  <span className="sewa-region__total">
                    {formatRupiah(items.reduce((acc, loc) => acc + (loc.amount || 0), 0))}
                  </span>
                </div>
                {items.map((loc) => {
                  const isPending = loc.status === "hold";
                  const isActive = loc.status === "active";
                  const statusClass = isActive ? "sewa-loc__status--active" : isPending ? "sewa-loc__status--pending" : "sewa-loc__status--inactive";
                  
                  return (
                    <div className={cn("sewa-loc", isActive && "sewa-loc--active")} key={loc.code}>
                      <span className="sewa-loc__code">{loc.code}</span>
                      <span className={cn("sewa-loc__status", statusClass)}>
                        <span className="sewa-loc__status-dot"></span>
                        {loc.status}
                      </span>
                    </div>
                  )
                })}
              </div>
            );
          })}
        </div>
      </section>

      {/* Recent activity */}
      <section className="section">
        <div className="section__head">
          <div className="row-flex">
            <h2 className="section__title">Aktivitas Terbaru</h2>
            <span className="section__meta">Aktivitas terakhir</span>
          </div>
        </div>
        <div className="panel" style={{ padding: 0 }}>
          <div className="overflow-x-auto">
            <table className="ledger">
              <thead>
                <tr>
                  <th style={{ width: 100 }}>Tanggal</th>
                  <th>Keterangan</th>
                  <th>Kategori</th>
                  <th className="num" style={{ width: 140 }}>Nominal</th>
                </tr>
              </thead>
              <tbody>
                {activities.map((act) => (
                  <tr key={act._id}>
                    <td className="num">{formatDateShort(act.date)}</td>
                    <td>{act.title}</td>
                    <td>
                      <span className="badge badge--outline">{act.category}</span>
                    </td>
                    <td className={cn("num", (act.amount ?? 0) > 0 ? "text-pos" : "text-neg")}>
                      {(act.amount ?? 0) > 0 ? "+" : "−"}{formatRupiah(Math.abs(act.amount ?? 0))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <div className="footer-meta">
        <span>Data source · MongoDB agent-asharitech-angkasa</span>
        <span>Angkasa · Dashboard Refactored</span>
      </div>
    </main>
  );
}
