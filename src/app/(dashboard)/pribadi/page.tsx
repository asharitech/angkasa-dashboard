import { getPribadiSummary } from "@/lib/data";
import { getSession } from "@/lib/auth";
import { formatRupiah, formatDateShort } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Download, Wallet, CreditCard, PiggyBank, ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { SummaryStrip, SummaryCell } from "@/components/summary-strip";
import Link from "next/link";
import { EntryCreateButton } from "@/components/entry-row-actions";

export const dynamic = "force-dynamic";

export default async function PribadiPage() {
  const [data, session] = await Promise.all([getPribadiSummary(), getSession()]);
  const isAdmin = session?.role === "admin";

  const bcaAccount = data.personalAccounts.find((a) => a._id === "bca_angkasa");
  const briAccount = data.personalAccounts.find((a) => a._id === "bri_angkasa");
  const bcaBalance = bcaAccount?.balance ?? 0;
  const briEstatement = briAccount?.balance ?? 0;
  const numpangTotal = data.numpang.reduce((s, n) => s + n.amount, 0);
  const briKas = briEstatement - numpangTotal;
  const cashTotal = bcaBalance + briKas;
  const piutangTotal = data.piutangByMonth.reduce((s, p) => s + p.total, 0);

  const totalSavings = data.savingsTotal.reduce((s, r) => {
    return s + (r.total_out > 0 ? r.total_out : r.total_in > 0 ? r.total_in : r.total);
  }, 0);

  const witaParts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Makassar",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(new Date());
  const witaYear = witaParts.find((p) => p.type === "year")?.value ?? "1970";
  const witaMonth = witaParts.find((p) => p.type === "month")?.value ?? "01";
  const currentMonth = `${witaYear}-${witaMonth}`;
  let cicilanBulanIni = 0;
  let totalRemainingDebt = 0;
  
  for (const loan of data.loans) {
    for (const s of loan.schedule ?? []) {
      if (s.status !== "lunas") totalRemainingDebt += s.amount;
      if (s.month === currentMonth) cicilanBulanIni += s.amount;
    }
  }
  const recurringTotal = data.recurring.reduce((s, r) => s + (r.amount ?? 0), 0);

  // Group items
  const piutangItems = data.piutangItems.filter((i) => (i.amount ?? 0) > 0);

  return (
    <main className="content" data-screen-label="05 Keuangan Pribadi">
      <PageHeader 
        eyebrow="Tanggungan Personal"
        title="Buku Pribadi"
        subtitle={`Ledger & rekap keuangan pribadi · ${data.spending.length} transaksi terakhir`}
      >
        <button className="btn btn--secondary"><Download className="btn__icon"/> Export</button>
        {isAdmin && <EntryCreateButton accounts={data.personalAccounts} label="Catat transaksi" />}
      </PageHeader>

      <SummaryStrip variant="sewa" style={{ marginBottom: "var(--sp-8)" }}>
        <SummaryCell 
          variant="sewa"
          label="Saldo Saat Ini" 
          value={formatRupiah(cashTotal)} 
          valueClassName="ss-cell__value--hero"
          icon={<Wallet />}
          subtext="Total likuiditas pribadi" 
        />
        <SummaryCell 
          variant="sewa"
          label="Pemasukan Bulan Ini" 
          value={formatRupiah(totalSavings)} 
          valueClassName="text-pos-700"
          icon={<PiggyBank />}
          subtext="Dari gaji & lainnya" 
        />
        <SummaryCell 
          variant="sewa"
          label="Pengeluaran Bulan Ini" 
          value={formatRupiah(cicilanBulanIni)} 
          valueClassName="text-neg-700"
          icon={<CreditCard />}
          subtext="Total debit tercatat" 
        />
      </SummaryStrip>

      {/* Pinjaman tahap */}
      <section className="section">
        <div className="section__head">
          <div className="row-flex">
            <h2 className="section__title">Dana Pinjam ke Yayasan</h2>
            <span className="section__meta">{data.loans.length} tahap · {formatRupiah(totalRemainingDebt)} outstanding</span>
          </div>
          <Link className="section__link" href="#">Riwayat pinjaman <ArrowRight className="w-3 h-3 ml-1"/></Link>
        </div>
        <div className="loan-track" style={{ gridTemplateColumns: `repeat(${Math.max(1, data.loans.length)}, 1fr)` }}>
          {data.loans.map((loan, idx) => {
            const schedule = loan.schedule ?? [];
            const remaining = schedule.filter((s) => s.status !== "lunas");
            const paid = schedule.filter((s) => s.status === "lunas");
            const remainingAmt = remaining.reduce((s, r) => s + r.amount, 0);
            const paidAmt = paid.reduce((s, r) => s + r.amount, 0);
            const totalAmt = remainingAmt + paidAmt;
            const pct = totalAmt > 0 ? (paidAmt / totalAmt) * 100 : 0;
            const isLunas = pct === 100;
            
            return (
              <div className="loan-cell" key={loan._id}>
                <div className="loan-cell__head">
                  <span className="loan-cell__title">Tahap {idx + 1}</span>
                  <span className="loan-cell__pct">{schedule[0]?.month || "N/A"}</span>
                </div>
                <div className="loan-cell__amount">{formatRupiah(totalAmt)}</div>
                <div className="bar"><div className={cn("bar__fill", isLunas ? "bar__fill--pos" : pct > 0 ? "bar__fill--warn" : "bar__fill--neg")} style={{ width: `${Math.max(1, pct)}%` }}></div></div>
                <div className="loan-cell__meta">
                  {pct > 0 ? `Dikembalikan ${formatRupiah(paidAmt)} · ${pct.toFixed(0)}%` : "Belum ada pengembalian"}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Numpang & Piutang */}
      <section className="section">
        <div className="grid grid--2">
          {/* Numpang */}
          <div>
            <div className="section__head">
              <div className="row-flex"><h2 className="section__title">Dana Numpang di BRI</h2><span className="section__meta">{formatRupiah(numpangTotal)}</span></div>
            </div>
            <div className="ledger-frame">
              {data.numpang.length === 0 ? (
                <div className="p-4 text-center text-sm text-ink-500">Tidak ada dana numpang.</div>
              ) : (
                data.numpang.map(n => {
                  const initials = n.description.substring(0, 2).toUpperCase();
                  return (
                    <div className="piutang-item" key={n._id}>
                      <div className="piutang-item__avatar" style={{ background: "color-mix(in oklab, var(--warn-500) 14%, var(--surface))", color: "var(--warn-700)" }}>{initials}</div>
                      <div className="piutang-item__main">
                        <div className="piutang-item__top"><span style={{ fontWeight: 600 }}>{n.description}</span></div>
                        <div className="piutang-item__meta-row">
                          <span>{n.parked_in?.replace(/_/g, " ").toUpperCase()}</span>
                          {n.notes && (
                            <>
                              <span className="piutang-item__dot"></span>
                              <span className="mono">{n.notes}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="piutang-item__right">
                        <div className="mono" style={{ fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{formatRupiah(n.amount)}</div>
                        <span className="badge badge--warn"><span className="badge__dot"></span>Perlu pindah</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Piutang Individu */}
          <div>
            <div className="section__head">
              <div className="row-flex"><h2 className="section__title">Piutang Individu</h2><span className="section__meta">{piutangItems.length} orang · {formatRupiah(piutangTotal)}</span></div>
            </div>
            <div className="ledger-frame">
              {piutangItems.length === 0 ? (
                <div className="p-4 text-center text-sm text-ink-500">Tidak ada piutang.</div>
              ) : (
                piutangItems.map(item => {
                  const nameParts = item.item.split(" ");
                  const initials = nameParts.length > 1 ? nameParts[0][0] + nameParts[1][0] : nameParts[0].substring(0, 2);
                  return (
                    <div className="piutang-item" key={item._id}>
                      <div className="piutang-item__avatar">{initials.toUpperCase()}</div>
                      <div className="piutang-item__main">
                        <div className="piutang-item__top"><span style={{ fontWeight: 600 }}>{item.item}</span></div>
                        <div className="piutang-item__meta-row">
                          <span>{item.category?.replace(/_/g, " ")}</span>
                        </div>
                      </div>
                      <div className="piutang-item__right">
                        <div className="mono" style={{ fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{formatRupiah(item.amount || 0)}</div>
                        <span className="badge"><span className="badge__dot"></span>Aktif</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Personal ledger */}
      <section className="section">
        <div className="section__head">
          <div className="row-flex"><h2 className="section__title">Transaksi Pribadi {currentMonth}</h2><span className="section__meta">{data.spending.length} entri</span></div>
          <Link className="section__link" href="/aktivitas">Semua aktivitas <ArrowRight className="w-3 h-3 ml-1"/></Link>
        </div>
        <div className="panel" style={{ padding: 0 }}>
          <table className="ledger">
            <thead>
              <tr>
                <th style={{ width: 90 }}>Tanggal</th>
                <th>Keterangan</th>
                <th>Kategori</th>
                <th style={{ width: 120 }}>Akun</th>
                <th className="num" style={{ width: 140 }}>Masuk</th>
                <th className="num" style={{ width: 140 }}>Keluar</th>
              </tr>
            </thead>
            <tbody>
              {data.spending.length === 0 ? (
                <tr><td colSpan={6} className="text-center p-4 text-ink-500">Belum ada transaksi.</td></tr>
              ) : (
                data.spending.slice(0, 10).map((entry) => (
                  <tr key={entry._id}>
                    <td className="num">{formatDateShort(entry.date)}</td>
                    <td>{entry.description}</td>
                    <td><span className="badge badge--outline">{entry.category?.replace(/_/g, " ")}</span></td>
                    <td>{entry.direction === "in" ? "BCA" : "BRI"}</td>
                    {entry.direction === "in" ? (
                      <>
                        <td className="num text-pos">+{formatRupiah(entry.amount)}</td>
                        <td className="num">—</td>
                      </>
                    ) : (
                      <>
                        <td className="num">—</td>
                        <td className="num text-neg">−{formatRupiah(entry.amount)}</td>
                      </>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
