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
import { formatRupiah, formatDateShort } from "@/lib/format";
import { cn } from "@/lib/utils";
import { formatRequestorName } from "@/lib/names";
import {
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
  
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
      <section className="hero bg-white rounded-2xl shadow-sm border border-ink-100 overflow-hidden mb-8 transition-all hover:shadow-md">
        <div className="hero__main p-8 md:p-10">
          <div className="hero__eyebrow flex items-center gap-3 text-[10px] font-bold tracking-widest uppercase text-ink-400 mb-4">
            <span className="w-2 h-2 bg-accent-700 rounded-full animate-pulse"></span>
            Dana Efektif {displayDate ? `· per ${formatDateShort(displayDate)}` : ""}
          </div>
          <div className="hero__amount text-5xl md:text-7xl font-bold tracking-tighter text-ink-000 leading-none mb-6">
            <span className="text-2xl md:text-3xl font-medium text-ink-300 mr-2">Rp</span>
            {danaEfektif.toLocaleString('id-ID')}
          </div>
          <div className="hero__formula flex items-center gap-3 p-4 bg-ink-025 rounded-xl border border-ink-100 w-fit">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-ink-400">Saldo BTN</span>
              <span className="font-mono font-bold text-ink-700">{formatRupiah(saldo)}</span>
            </div>
            <span className="text-xl text-ink-200">−</span>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-ink-400">Kewajiban</span>
              <span className="font-mono font-bold text-neg-700">{formatRupiah(totalKewajiban)}</span>
            </div>
          </div>
        </div>
        <div className="hero__side bg-ink-025/50 p-8 md:p-10 border-l border-ink-100 flex flex-col justify-center gap-8">
          <div>
            <div className="flex items-baseline justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className={cn("w-3 h-3 rounded-full", health.tone === 'pos' ? "bg-pos-500 shadow-[0_0_0_4px_var(--pos-100)]" : "bg-warn-500 shadow-[0_0_0_4px_var(--warn-100)]")}></span>
                <span className="text-lg font-bold text-ink-000">{health.label}</span>
              </div>
              <span className={cn("font-mono font-bold text-xl", health.tone === 'neg' ? "text-neg-700" : "text-ink-700")}>
                {(healthRatio * 100).toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-ink-100 h-2.5 rounded-full overflow-hidden">
              <div
                className={cn("h-full transition-all duration-1000", health.tone === 'pos' ? "bg-pos-500" : health.tone === 'warn' ? "bg-warn-500" : "bg-neg-500")}
                style={{ width: `${Math.min(100, healthRatio * 100)}%` }}
              ></div>
            </div>
            <div className="flex justify-between mt-2 text-[10px] font-bold uppercase tracking-wider text-ink-400">
              <span>Efisiensi Dana</span>
              <span>Target ≥ 50%</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-8 gap-y-6">
            <div className="space-y-1">
              <div className="text-[10px] uppercase font-bold text-ink-400 tracking-wider">Cash Yayasan</div>
              <div className="font-mono font-bold text-ink-900">{formatRupiah(cashSisa)}</div>
            </div>
            <div className="space-y-1">
              <div className="text-[10px] uppercase font-bold text-ink-400 tracking-wider">Sewa Aktif</div>
              <div className="font-mono font-bold text-ink-900">{formatRupiah(sewaTotal)}</div>
            </div>
            <div className="space-y-1">
              <div className="text-[10px] uppercase font-bold text-ink-400 tracking-wider">Kewajiban</div>
              <div className="font-mono font-bold text-neg-700">{formatRupiah(totalKewajiban)}</div>
            </div>
            <div className="space-y-1">
              <div className="text-[10px] uppercase font-bold text-ink-400 tracking-wider">Pending</div>
              <div className="font-mono font-bold text-warn-700">{data.pengajuanPending} <span className="text-[10px] font-medium">items</span></div>
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
        <section className="section mb-10">
          <div className="section__head mb-4 border-b border-ink-100 pb-2">
            <div className="flex items-baseline gap-3">
              <h2 className="text-xl font-bold text-ink-000">Rekening & Saldo</h2>
              <span className="text-xs font-mono text-ink-400 uppercase tracking-wider">{displayAccounts.length} accounts</span>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {displayAccounts.map((acc: { _id: string, bank: string, type: string, balance: number, holder: string }, i: number) => (
              <div className="group bg-white p-5 rounded-xl border border-ink-100 shadow-sm hover:border-accent-300 hover:shadow-md transition-all cursor-default" key={acc._id || i}>
                <div className="flex items-center justify-between mb-4">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-ink-400 group-hover:text-accent-700 transition-colors">{acc.bank}</div>
                  <div className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-ink-050 text-ink-500 border border-ink-100 uppercase tracking-tighter">{acc.type || "Vault"}</div>
                </div>
                <div className="text-xl font-bold font-mono text-ink-000 mb-1 tracking-tight">
                  {formatRupiah(acc.balance || 0)}
                </div>
                <div className="text-[11px] font-medium text-ink-500 truncate opacity-80 group-hover:opacity-100">
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
      <section className="section mb-10">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Transfer pipeline */}
          <div className="bg-white rounded-xl border border-ink-100 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-ink-050 bg-ink-025/30 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-ink-000">Pipeline Transfer Masuk</h3>
                <p className="text-[10px] uppercase font-bold text-ink-400 tracking-wider">
                  {pendingTransfers.pending.length} lokasi · {formatRupiah(pendingTransfers.totalExpected)}
                </p>
              </div>
              <Link href="/sewa" className="text-xs font-bold text-accent-700 hover:text-accent-900 flex items-center gap-1 transition-colors">
                Kelola <ArrowRight className="w-3 h-3"/>
              </Link>
            </div>
            <div className="divide-y divide-ink-050">
              {pendingTransfers.pending.length === 0 ? (
                <div className="p-8 text-center text-sm text-ink-400 italic">Tidak ada transfer masuk yang tertunda.</div>
              ) : (
                pendingTransfers.pending.slice(0, 5).map((loc) => (
                  <div className="p-4 flex items-center justify-between hover:bg-ink-025 transition-colors" key={loc.code}>
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-accent-050 flex items-center justify-center text-accent-700 font-mono font-bold text-xs">
                        {loc.code.substring(0, 2)}
                      </div>
                      <div>
                        <div className="font-bold text-ink-000 text-sm">{loc.code}</div>
                        <div className="text-xs text-ink-400">via {formatRequestorName(loc.pipeline?.holder)}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-ink-000 text-sm">{formatRupiah(loc.pipeline?.expected_amount ?? loc.amount ?? 0)}</div>
                      <div className="flex items-center justify-end gap-1.5 mt-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-warn-500"></span>
                        <span className="text-[10px] font-bold uppercase text-warn-700 tracking-tighter">Belum Diterima</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Kewajiban breakdown */}
          <div className="bg-white rounded-xl border border-ink-100 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-ink-050 bg-ink-025/30 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-ink-000">Breakdown Kewajiban</h3>
                <p className="text-[10px] uppercase font-bold text-ink-400 tracking-wider">Outstanding Liabilities</p>
              </div>
              <Link href="/laporan-op" className="text-xs font-bold text-accent-700 hover:text-accent-900 flex items-center gap-1 transition-colors">
                Laporan <ArrowRight className="w-3 h-3"/>
              </Link>
            </div>
            <div className="p-5 space-y-4">
              {kewajibanRowsData.length === 0 ? (
                <div className="p-4 text-center text-sm text-ink-400 italic">Tidak ada kewajiban.</div>
              ) : (
                <>
                  <div className="space-y-2">
                    {kewajibanRowsData.map((row) => (
                      <div className="flex items-center justify-between py-2 group" key={row.label}>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-ink-700 group-hover:text-ink-900 transition-colors">{row.label}</span>
                          <div className="w-32 h-1 bg-ink-050 rounded-full mt-1 overflow-hidden">
                            <div className="h-full bg-neg-500 opacity-30 group-hover:opacity-60 transition-all" style={{ width: `${(row.amount / totalKewajiban) * 100}%` }}></div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-mono font-bold text-neg-700">{formatRupiah(row.amount)}</div>
                          <div className="text-[10px] font-mono text-ink-400">{((row.amount / totalKewajiban) * 100).toFixed(1)}% share</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="pt-4 border-t border-ink-100 flex items-center justify-between">
                    <span className="font-bold text-ink-000 uppercase text-xs tracking-widest">Total Kewajiban</span>
                    <span className="font-mono font-bold text-xl text-neg-700">{formatRupiah(totalKewajiban)}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Sewa locations */}
      <section className="section mb-10">
        <div className="section__head mb-4 flex items-baseline justify-between border-b border-ink-100 pb-2">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-ink-000">Sewa Dapur</h2>
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-pos-050 border border-pos-100">
              <span className="w-1.5 h-1.5 rounded-full bg-pos-500 animate-pulse"></span>
              <span className="text-[10px] font-bold text-pos-700 uppercase tracking-tighter">{activeCount}/{sewaLocations.length} Aktif</span>
            </div>
            <span className="text-xs font-mono font-bold text-ink-400">{formatRupiah(sewaTotal)}</span>
          </div>
          <Link href="/sewa" className="text-xs font-bold text-accent-700 hover:text-accent-900 flex items-center gap-1 transition-colors">
            Detail Sewa <ArrowRight className="w-3 h-3"/>
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-0 rounded-xl border border-ink-100 bg-white overflow-hidden shadow-sm">
          {[0, 1, 2].map((colIndex) => {
            const itemsPerCol = Math.ceil(sewaLocations.length / 3);
            const items = sewaLocations.slice(colIndex * itemsPerCol, (colIndex + 1) * itemsPerCol);
            if (items.length === 0) return null;
            
            return (
              <div className={cn("p-5", colIndex < 2 && "border-r border-ink-050")} key={colIndex}>
                <div className="flex items-center justify-between mb-4 border-b border-ink-050 pb-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-ink-400">Cluster {colIndex + 1}</span>
                  <span className="font-mono text-[10px] font-bold text-ink-500">
                    {formatRupiah(items.reduce((acc, loc) => acc + (loc.amount || 0), 0))}
                  </span>
                </div>
                <div className="space-y-1">
                  {items.map((loc) => {
                    const isPending = loc.status === "hold";
                    const isActive = loc.status === "active";

                    return (
                      <div className={cn("flex items-center justify-between p-2 rounded-lg transition-colors group", isActive ? "hover:bg-pos-050/30" : "hover:bg-ink-025")} key={loc.code}>
                        <span className={cn("text-sm font-bold", isActive ? "text-ink-900" : "text-ink-400")}>{loc.code}</span>
                        <div className="flex items-center gap-2">
                          <span className={cn("text-[9px] font-bold uppercase tracking-tighter opacity-70 group-hover:opacity-100", isActive ? "text-pos-700" : isPending ? "text-warn-700" : "text-ink-300")}>
                            {loc.status}
                          </span>
                          <span className={cn("w-1.5 h-1.5 rounded-full", isActive ? "bg-pos-500" : isPending ? "bg-warn-500" : "bg-ink-200")}></span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Recent activity */}
      <section className="section mb-10">
        <div className="section__head mb-4 border-b border-ink-100 pb-2 flex items-baseline justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-ink-000">Aktivitas Terbaru</h2>
            <span className="text-[10px] font-bold uppercase tracking-widest text-ink-400">Live Feed</span>
          </div>
          <Link href="/aktivitas" className="text-xs font-bold text-accent-700 hover:text-accent-900 flex items-center gap-1 transition-colors">
            Semua Aktivitas <ArrowRight className="w-3 h-3"/>
          </Link>
        </div>
        <div className="bg-white rounded-xl border border-ink-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="ledger w-full">
              <thead>
                <tr className="bg-ink-025/50">
                  <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-ink-400">Tanggal</th>
                  <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-ink-400">Keterangan</th>
                  <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-ink-400">Kategori</th>
                  <th className="px-6 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-ink-400">Nominal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-050">
                {activities.map((act) => (
                  <tr className="hover:bg-ink-025/50 transition-colors" key={act._id}>
                    <td className="px-6 py-4 whitespace-nowrap font-mono text-xs text-ink-500">{formatDateShort(act.date)}</td>
                    <td className="px-6 py-4 font-medium text-ink-900 text-sm">{act.title}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 rounded-full bg-ink-050 text-ink-500 text-[10px] font-bold uppercase tracking-tighter border border-ink-100">
                        {act.category}
                      </span>
                    </td>
                    <td className={cn("px-6 py-4 text-right font-mono font-bold text-sm", (act.amount ?? 0) > 0 ? "text-pos-700" : "text-neg-700")}>
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
