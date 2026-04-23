import Link from "next/link";
import { getDanaCashSummary } from "@/lib/dana-cash";
import { formatRupiah, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  Banknote,
  TrendingDown,
  Wallet,
  ChevronRight,
  Inbox,
  History,
} from "lucide-react";

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
      <div className="page-head">
        <div>
          <div className="t-eyebrow" style={{ marginBottom: "var(--sp-2)" }}>Yayasan YRBB · Petty Cash</div>
          <h1 className="page-head__title">Cash Yayasan</h1>
          <div className="page-head__sub">Monitoring pemakaian kas kecil yayasan</div>
        </div>
        <div className="page-head__actions">
          {pengajuan.length > 0 && (
            <Link href="/pengajuan" className="btn btn--secondary">
              <Inbox className="btn__icon" /> {pengajuan.length} pengajuan pending ({formatRupiah(pengajuan.reduce((s, o) => s + (o.amount ?? 0), 0))})
            </Link>
          )}
        </div>
      </div>

      <div className="tabs" style={{ marginBottom: "var(--sp-8)" }}>
        <Link href="?" className={cn("tabs__item", !period && "is-active")}>Semua</Link>
        <Link href="?period=2026-04" className={cn("tabs__item", period === "2026-04" && "is-active")}>Apr 2026</Link>
        <Link href="?period=2026-03" className={cn("tabs__item", period === "2026-03" && "is-active")}>Mar 2026</Link>
        <Link href="?period=2026-02" className={cn("tabs__item", period === "2026-02" && "is-active")}>Feb 2026</Link>
        <Link href="?period=2026-01" className={cn("tabs__item", period === "2026-01" && "is-active")}>Jan 2026</Link>
      </div>

      <div className="sewa-summary">
        <div className="ss-cell">
          <div className="ss-cell__label">Saldo Awal</div>
          <div className="ss-cell__value">{formatRupiah(saldoAwal)}</div>
        </div>
        <div className="ss-cell">
          <div className="ss-cell__label">Terpakai</div>
          <div className="ss-cell__value" style={{ color: "var(--warn-700)" }}>{formatRupiah(totalTerpakai)}</div>
          <div className="ss-cell__sub">{pctTerpakai}% dari awal</div>
          <div className="ss-cell__progress"><div className="bar"><div className="bar__fill bar__fill--warn" style={{ width: `${Math.min(pctTerpakai, 100)}%` }}></div></div></div>
        </div>
        <div className="ss-cell">
          <div className="ss-cell__label">Sisa Cash</div>
          <div className="ss-cell__value" style={{ color: "var(--pos-700)" }}>{formatRupiah(saldoSisa)}</div>
        </div>
      </div>

      <section className="section">
        <div className="section__head">
          <h2 className="section__title">Riwayat Pengeluaran Cash</h2>
          <span className="section__meta">{pengeluaran.length} item</span>
        </div>
        <div className="ledger">
          <div className="ledger-row ledger-row--header">
            <div style={{ width: "120px" }}>Tanggal</div>
            <div style={{ flex: "1" }}>Keterangan</div>
            <div style={{ width: "150px", textAlign: "right" }}>Jumlah</div>
          </div>
          {pengeluaran.length === 0 ? (
            <div className="p-8 text-center text-ink-500">Belum ada pengeluaran dicatat.</div>
          ) : (
            pengeluaran.map(r => (
              <div className="ledger-row" key={r._id}>
                <div style={{ width: "120px", fontFamily: "var(--font-mono)", color: "var(--ink-500)" }}>{formatDate(r.date)}</div>
                <div style={{ flex: "1", color: "var(--ink-000)", fontWeight: 500 }}>{r.description}</div>
                <div style={{ width: "150px", textAlign: "right", fontFamily: "var(--font-mono)", color: "var(--neg-700)", fontWeight: 600 }}>
                  {formatRupiah(r.amount)}
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
