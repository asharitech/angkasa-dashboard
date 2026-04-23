import { getLedger, getLaporanOpReconciliation } from "@/lib/data";
import { formatRupiah, formatDate, formatDateShort } from "@/lib/format";
import { FileOutput, ArrowRight, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function LaporanOpPage() {
  const [ledger, recon] = await Promise.all([
    getLedger("laporan_op"),
    getLaporanOpReconciliation(),
  ]);

  if (!ledger?.laporan_op) {
    return <main className="content"><div className="p-8 text-center text-ink-500">Laporan Operasional belum tersedia.</div></main>;
  }

  const { entries, totals, kewajiban, dana_efektif } = ledger.laporan_op;
  const reconHasDiff = recon && (recon.diffMasuk !== 0 || recon.diffKeluar !== 0);

  // Group obligations
  const kewajibanList = Object.entries(kewajiban as Record<string, number>)
    .filter(([key, value]) => /^dana_pinjam_angkasa_tahap\d+$/.test(key) && value != null)
    .sort((a, b) => {
      const aNum = Number(a[0].match(/tahap(\d+)$/)?.[1] ?? 0);
      const bNum = Number(b[0].match(/tahap(\d+)$/)?.[1] ?? 0);
      return aNum - bNum;
    });

  const percentEfektif = totals.saldo > 0 ? (dana_efektif / totals.saldo) * 100 : 0;

  return (
    <main className="content" data-screen-label="06 Laporan OP">
      <PageHeader 
        eyebrow="Laporan Op · Sandbox"
        title="Validasi Saldo & Kewajiban"
        subtitle={`Ledger & rekap keuangan operasional · ${entries.length} transaksi terakhir`}
      >
        <button className="btn btn--secondary"><FileOutput className="btn__icon"/> Export</button>
      </PageHeader>

      {reconHasDiff && recon && (
        <div className="mb-6 p-4 rounded bg-warn-50 border border-warn-200 text-warn-800 text-sm flex gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <div>
            <div className="font-semibold mb-1">Rekonsiliasi: Terdapat selisih antara Ledger vs Entries</div>
            <p>Selisih bukan error — Laporan Op adalah snapshot manual. Update via mongo_helper bila perlu.</p>
            <div className="mt-2 grid grid-cols-2 gap-4">
              <div>Masuk diff: <span className="font-mono">{formatRupiah(recon.diffMasuk)}</span></div>
              <div>Keluar diff: <span className="font-mono">{formatRupiah(recon.diffKeluar)}</span></div>
            </div>
          </div>
        </div>
      )}

      {/* Snapshot */}
      <div className="hero-split">
        <div className="hero-main">
          <div className="t-eyebrow" style={{ marginBottom: "var(--sp-3)" }}>
            <span style={{ display: "inline-block", width: 5, height: 5, background: "var(--info-500)", borderRadius: "50%", marginRight: 8, verticalAlign: "middle" }}></span>
            Saldo Tersedia
          </div>
          <div className="hero-amount"><span className="sym">Rp</span>{totals.saldo.toLocaleString('id-ID')}</div>
          <div className="hero-breakdown">
            <span style={{ color: "var(--pos-700)" }}>+{formatRupiah(totals.masuk)} masuk</span>
            <span>·</span>
            <span style={{ color: "var(--neg-700)" }}>−{formatRupiah(totals.keluar)} keluar</span>
            <span>·</span>
            <span>{entries.length} transaksi</span>
          </div>
        </div>
        <div className="hero-side">
          <div>
            <div className="t-eyebrow">Dana Efektif</div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-2xl)", fontWeight: 600, color: "var(--ink-000)", marginTop: 4 }}>
              {formatRupiah(dana_efektif)}
            </div>
            <div className="t-caption" style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 6 }}>
              <div className="bar" style={{ width: 80, height: 4 }}><div className={cn("bar__fill", percentEfektif >= 100 ? "bar__fill--pos" : percentEfektif >= 50 ? "bar__fill--warn" : "bar__fill--neg")} style={{ width: `${Math.min(100, Math.max(0, percentEfektif))}%` }}></div></div>
              {percentEfektif.toFixed(0)}% dr saldo
            </div>
          </div>
          <div className="divider" style={{ margin: 0 }}></div>
          <div>
            <div className="t-eyebrow">Kewajiban</div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-xl)", fontWeight: 600, color: "var(--neg-700)", marginTop: 4 }}>
              −{formatRupiah(kewajiban.total)}
            </div>
            <Link className="t-caption" style={{ marginTop: 2, display: "inline-flex", alignItems: "center", color: "var(--info-700)", textDecoration: "none" }} href="/pribadi">
              Lihat hutang ke Pak Angkasa <ArrowRight className="w-3 h-3 ml-1"/>
            </Link>
          </div>
        </div>
      </div>

      <div className="two-col mt-6">
        {/* Ledger */}
        <div className="panel" style={{ padding: 0 }}>
          <div className="section__head" style={{ padding: "var(--sp-4) var(--sp-5)", borderBottom: "1px solid var(--ink-200)" }}>
            <h2 className="section__title">Mutasi Rekening</h2>
            <span className="section__meta">{entries.length} baris mutasi</span>
          </div>
          
          <table className="ledger">
            <thead>
              <tr>
                <th style={{ width: 48, textAlign: "center" }}>No</th>
                <th>Keterangan</th>
                <th className="num" style={{ width: 140 }}>Masuk</th>
                <th className="num" style={{ width: 140 }}>Keluar</th>
                <th className="num" style={{ width: 160 }}>Saldo</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((r, i) => {
                const isSelected = i === entries.length - 1; // Highlight last entry
                return (
                  <tr key={r.no} className={isSelected ? "is-selected" : ""}>
                    <td className="num" style={{ textAlign: "center", color: "var(--ink-400)" }}>{r.no}</td>
                    <td style={{ fontWeight: isSelected ? 600 : 400 }}>{r.keterangan}</td>
                    {r.masuk > 0 ? (
                      <td className="num text-pos">+{formatRupiah(r.masuk)}</td>
                    ) : <td className="num text-ink-300">—</td>}
                    {r.keluar > 0 ? (
                      <td className="num text-neg">−{formatRupiah(r.keluar)}</td>
                    ) : <td className="num text-ink-300">—</td>}
                    <td className="num" style={{ fontWeight: 600 }}>{formatRupiah(r.saldo)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Side summary */}
        <aside className="detail" style={{ position: "sticky", top: "var(--sp-6)", padding: "var(--sp-6)", background: "var(--surface)", border: "1px solid var(--ink-200)", borderRadius: "var(--r-md)", alignSelf: "start" }}>
          <div className="detail__body" style={{ padding: 0 }}>
            <div className="t-eyebrow">Rekapitulasi {ledger.period || "Bulan Ini"}</div>
            <div className="divider"></div>
            
            <div style={{ marginBottom: "var(--sp-5)" }}>
              <div className="row-between" style={{ marginBottom: 4 }}>
                <span className="t-label">Saldo Awal</span>
                <span className="mono" style={{ fontWeight: 600 }}>{formatRupiah(entries[0]?.saldo - (entries[0]?.masuk || 0) + (entries[0]?.keluar || 0) || 0)}</span>
              </div>
              <div className="row-between" style={{ marginBottom: 4 }}>
                <span className="t-label text-pos">Total Masuk</span>
                <span className="mono text-pos">+{formatRupiah(totals.masuk)}</span>
              </div>
              <div className="row-between" style={{ marginBottom: 4 }}>
                <span className="t-label text-neg">Total Keluar</span>
                <span className="mono text-neg">−{formatRupiah(totals.keluar)}</span>
              </div>
              <div className="row-between" style={{ paddingTop: 8, marginTop: 8, borderTop: "1px dashed var(--ink-200)" }}>
                <span className="t-label">Saldo Akhir</span>
                <span className="mono" style={{ fontWeight: 600, fontSize: "var(--text-lg)" }}>{formatRupiah(totals.saldo)}</span>
              </div>
            </div>

            <div className="t-eyebrow">Kewajiban Ditahan</div>
            <div className="divider"></div>

            {kewajibanList.map(([key, val]) => (
              <div className="row-between" style={{ marginBottom: 4 }} key={key}>
                <span className="t-label">Tahap {key.match(/tahap(\d+)$/)?.[1]}</span>
                <span className="mono">−{formatRupiah(val as number)}</span>
              </div>
            ))}
            
            <div className="row-between" style={{ paddingTop: 8, marginTop: 8, borderTop: "1px dashed var(--ink-200)" }}>
              <span className="t-label" style={{ fontWeight: 600 }}>Total Kewajiban</span>
              <span className="mono text-neg" style={{ fontWeight: 600 }}>−{formatRupiah(kewajiban.total)}</span>
            </div>

            <div className="alert-box" style={{ marginTop: "var(--sp-5)" }}>
              <div className="alert-box__title">Dana Efektif: {formatRupiah(dana_efektif)}</div>
              <div>Dana yang benar-benar bisa dipakai setelah dikurangi hutang.</div>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
