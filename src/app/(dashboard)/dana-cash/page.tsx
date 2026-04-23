import Link from "next/link";
import { getDanaCashSummary } from "@/lib/dana-cash";
import { formatRupiah, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ChevronRight, ArrowRight, Download, History } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { ToneBadge } from "@/components/tone-badge";
import { SummaryStrip, SummaryCell } from "@/components/summary-strip";

export const dynamic = "force-dynamic";

type Pengeluaran = { _id: string; date: string; description: string; amount: number };

export default async function DanaCashPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const { period } = await searchParams;
  const summary = await getDanaCashSummary({ period });
  const { saldoAwal, saldoSisa, pengeluaran, pengajuan } = summary;

  const totalTerpakai = period
    ? pengeluaran.reduce((s, e) => s + e.amount, 0)
    : summary.totalTerpakai;
  // Saldo awal + top-up = max(saldoAwal, saldoSisa + totalTerpakai) covers cash injection cases.
  const totalAvailable = Math.max(saldoAwal, saldoSisa + totalTerpakai);
  const pctTerpakai = totalAvailable > 0 ? Math.round((totalTerpakai / totalAvailable) * 100) : 0;



  return (
    <main className="content" data-screen-label="07 Cash Yayasan">
      <PageHeader 
        eyebrow="Yayasan YRBB · Mutasi"
        title="Dana Cash"
        subtitle="Monitoring pemakaian kas kecil yayasan"
      >
        <button className="btn btn--secondary"><History className="btn__icon"/> Riwayat</button>
        <button className="btn btn--secondary"><Download className="btn__icon"/> Export laporan</button>
      </PageHeader>

      <div className="tabs" style={{ marginBottom: "var(--sp-8)" }}>
        <Link href="?" className={cn("tabs__item", !period && "is-active")}>Semua</Link>
        <Link href="?period=2026-04" className={cn("tabs__item", period === "2026-04" && "is-active")}>Apr 2026</Link>
        <Link href="?period=2026-03" className={cn("tabs__item", period === "2026-03" && "is-active")}>Mar 2026</Link>
        <Link href="?period=2026-02" className={cn("tabs__item", period === "2026-02" && "is-active")}>Feb 2026</Link>
        <Link href="?period=2026-01" className={cn("tabs__item", period === "2026-01" && "is-active")}>Jan 2026</Link>
      </div>

      <SummaryStrip variant="sewa">
        <SummaryCell 
          variant="sewa"
          label="Saldo Awal" 
          value={formatRupiah(saldoAwal)} 
        />
        <SummaryCell 
          variant="sewa"
          label="Terpakai" 
          value={formatRupiah(totalTerpakai)} 
          valueClassName="text-warn-700"
          subtext={`${pctTerpakai}% dari awal`}
        />
        <SummaryCell 
          variant="sewa"
          label="Sisa Cash" 
          value={formatRupiah(saldoSisa)} 
          valueClassName="text-pos-700"
        />
      </SummaryStrip>

      <section className="section">
        <div className="section__head">
          <h2 className="section__title">Riwayat Pengeluaran Cash</h2>
          <span className="section__meta">{pengeluaran.length} item</span>
        </div>
        <table className="ledger">
          <thead>
            <tr>
              <th style={{ width: "120px" }}>Tanggal</th>
              <th>Keterangan</th>
              <th className="num" style={{ width: "150px" }}>Jumlah</th>
            </tr>
          </thead>
          <tbody>
          {pengeluaran.length === 0 ? (
            <tr>
              <td colSpan={3} className="text-center" style={{ padding: "var(--sp-8)", color: "var(--ink-500)" }}>Belum ada pengeluaran dicatat.</td>
            </tr>
          ) : (
            pengeluaran.map(r => (
              <tr key={r._id}>
                <td className="num" style={{ color: "var(--ink-500)" }}>{formatDate(r.date)}</td>
                <td style={{ fontWeight: 500 }}>{r.description}</td>
                <td className="num text-neg">{formatRupiah(r.amount)}</td>
              </tr>
            ))
          )}
          </tbody>
        </table>
      </section>
    </main>
  );
}
