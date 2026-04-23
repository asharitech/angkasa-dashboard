import Link from "next/link";
import { getObligations, getAccounts } from "@/lib/data";
import { getSession } from "@/lib/auth";
import { formatRupiah, formatDateShort } from "@/lib/format";
import { formatRequestorName } from "@/lib/names";
import { currentWitaMonth } from "@/lib/periods";
import { cn } from "@/lib/utils";
import { History, Download, ChevronRight, Plus, Search, Filter } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { ToneBadge } from "@/components/tone-badge";
import { SummaryStrip, SummaryCell } from "@/components/summary-strip";
import type { Obligation, Account } from "@/lib/types";
import { PengajuanCreateButton, PengajuanDetailActions } from "@/components/pengajuan-row-actions";

export const dynamic = "force-dynamic";

export default async function PengajuanPage({
  searchParams,
}: {
  searchParams: Promise<{ monthView?: string; statusView?: string; selected?: string }>;
}) {
  const params = await searchParams;
  const monthView = params.monthView ?? currentWitaMonth();
  const statusView = params.statusView ?? "pending";

  const [allInScope, session, accounts] = await Promise.all([
    getObligations({ type: "pengajuan", month: monthView }),
    getSession(),
    getAccounts(),
  ]);

  const isAdmin = session?.role === "admin";
  const pendingItems = allInScope.filter((o) => o.status === "pending");
  const lunasItems = allInScope.filter((o) => o.status === "lunas");
  const activeItems = statusView === "lunas" ? lunasItems : pendingItems;

  const totalPending = pendingItems.reduce((s, o) => s + (o.amount ?? 0), 0);
  const totalLunas = lunasItems.reduce((s, o) => s + (o.amount ?? 0), 0);
  const totalScope = allInScope.reduce((s, o) => s + (o.amount ?? 0), 0);

  const selectedId = params.selected;
  const selectedItem = selectedId ? activeItems.find(o => o._id === selectedId) || allInScope.find(o => o._id === selectedId) : (activeItems[0] || allInScope[0]);

  return (
    <main className="content" data-screen-label="03 Pengajuan">
      <PageHeader 
        eyebrow="Yayasan YRBB · Payment Processing"
        title="Pengajuan Dana"
        subtitle={`${allInScope.length} permohonan · Filter: ${statusView !== "semua" ? statusView : "semua"}`}
      >
        <button className="btn btn--secondary"><History className="btn__icon"/> Riwayat</button>
        <button className="btn btn--secondary"><Download className="btn__icon"/> Export</button>
        {isAdmin && <PengajuanCreateButton />}
      </PageHeader>

      {/* Summary */}
      <SummaryStrip variant="standard">
        <SummaryCell 
          label="Menunggu Persetujuan" 
          value={pendingItems.length} 
          valueClassName="text-warn-700"
          subtext="Action required" 
        />
        <SummaryCell 
          label="Total Nominal Pending" 
          value={formatRupiah(totalPending)} 
          valueClassName="text-warn-700"
          subtext="Estimasi outflow" 
        />
        <SummaryCell 
          label="Selesai Ditransfer" 
          value={lunasItems.length} 
          valueClassName="text-pos-700"
          subtext={`Dari ${allInScope.length} total pengajuan`} 
        />
        <SummaryCell 
          label="Total Realisasi" 
          value={formatRupiah(totalLunas)} 
          valueClassName="text-ink-000"
          subtext="Total dana keluar" 
        />
      </SummaryStrip>

      {/* Tabs */}
      <div className="tabs">
        <Link href="?statusView=pending" className={cn("tabs__item", statusView === "pending" && "is-active")}>
          Pending <span className="tabs__count">{pendingItems.length}</span>
        </Link>
        <Link href="?statusView=lunas" className={cn("tabs__item", statusView === "lunas" && "is-active")}>
          Disetujui <span className="tabs__count">{lunasItems.length}</span>
        </Link>
        <Link href="?statusView=semua" className={cn("tabs__item", statusView === "semua" && "is-active")}>
          Semua <span className="tabs__count">{allInScope.length}</span>
        </Link>
      </div>

      {/* Filter bar */}
      <div className="filter-bar">
        <div className="input__wrap">
          <Search className="input__icon" />
          <input placeholder="Cari nama, kategori, atau kode pengajuan…" />
        </div>
        <button className="btn btn--secondary">
          <Filter className="btn__icon" /> Kategori <span style={{ color: "var(--ink-400)", marginLeft: 4 }}>All</span>
        </button>
        <button className="btn btn--secondary">Requester <span style={{ color: "var(--ink-400)", marginLeft: 4 }}>All</span></button>
        <button className="btn btn--secondary">Rentang <span style={{ color: "var(--ink-400)", marginLeft: 4 }}>{monthView}</span></button>
        <span style={{ marginLeft: "auto", fontFamily: "var(--font-mono)", fontSize: "var(--text-xs)", color: "var(--ink-500)" }}>
          {activeItems.length} hasil
        </span>
      </div>

      <div className="two-col">
        {/* Main list */}
        <div className="panel" style={{ padding: 0 }}>
          <div className="pj-header">
            <div><div style={{ width: 14, height: 14, border: "1px solid var(--ink-300)", borderRadius: 2 }}></div></div>
            <div>Kode</div>
            <div>Requester · Keterangan</div>
            <div>Kategori</div>
            <div>Status</div>
            <div className="pj-header__amount">Jumlah</div>
          </div>

          {activeItems.map((o) => {
            const isSelected = selectedItem?._id === o._id;
            const name = formatRequestorName(o.requestor);
            const initials = name.substring(0, 2).toUpperCase();
            const tone = o.status === "lunas" ? "pos" : o.status === "pending" ? "warn" : "neg";
            const toneLabel = o.status === "lunas" ? "Lunas" : o.status === "pending" ? "Menunggu" : "Ditolak";
            
            return (
              <Link href={`?statusView=${statusView}${monthView !== currentWitaMonth() ? "&monthView=" + monthView : ""}&selected=${o._id}`} className={cn("pj-row", isSelected && "is-selected")} key={o._id}>
                <div className="pj-row__check" style={isSelected ? { background: "var(--accent-700)", borderColor: "var(--accent-700)" } : {}}>
                  {isSelected && <div style={{width: 6, height: 6, background: 'white', borderRadius: 2}}></div>}
                </div>
                <div className="pj-row__code">PJ-{o._id.substring(o._id.length - 4)}</div>
                <div className="pj-row__who">
                  <div className="pj-row__who-avatar">{initials}</div>
                  <div style={{ minWidth: 0 }}>
                    <div className="pj-row__who-name">{name}</div>
                    <div className="pj-row__who-role">{o.item}</div>
                  </div>
                </div>
                <div><span className="cat-chip"><span className="badge__dot" style={{ color: "var(--info-500)" }}></span>{o.category || "lainnya"}</span></div>
                <div><ToneBadge tone={tone}>{toneLabel}</ToneBadge></div>
                <div style={{ textAlign: "right" }}>
                  <div className="pj-row__amount">{formatRupiah(o.amount || 0)}</div>
                  <div className="pj-row__date">{formatDateShort(o.created_at)}</div>
                </div>
              </Link>
            );
          })}
          
          {activeItems.length === 0 && (
            <div className="p-8 text-center text-ink-500">Tidak ada pengajuan ditemukan.</div>
          )}
        </div>

        {/* Detail panel */}
        {selectedItem && (
          <div className="detail">
            <div className="detail__head">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span className="detail__code">PJ-{selectedItem._id.substring(selectedItem._id.length - 4)}</span>
                <ToneBadge tone={selectedItem.status === "lunas" ? "pos" : "warn"}>
                  {selectedItem.status === "lunas" ? "Lunas" : "Menunggu Papi"}
                </ToneBadge>
              </div>
              <div className="detail__title">{selectedItem.item}</div>
              <div className="detail__amount">{formatRupiah(selectedItem.amount || 0)}</div>
            </div>

            <div className="detail__body">
              <div className="detail__row">
                <div className="detail__row-label">Requester</div>
                <div className="detail__row-value">{formatRequestorName(selectedItem.requestor)}</div>
              </div>
              <div className="detail__row">
                <div className="detail__row-label">Kategori</div>
                <div className="detail__row-value">{selectedItem.category?.replace(/_/g, " ")}</div>
              </div>
              <div className="detail__row">
                <div className="detail__row-label">Sumber Dana</div>
                <div className="detail__row-value">{selectedItem.sumber_dana || "Operasional"}</div>
              </div>
              <div className="detail__row">
                <div className="detail__row-label">Metode</div>
                <div className="detail__row-value">{selectedItem.bukti_type || "Transfer"}</div>
              </div>

              {selectedItem.detail && selectedItem.detail.length > 0 && (
                <div className="detail__note">
                  {selectedItem.detail.map(d => `${d.item}: ${formatRupiah(d.amount)}`).join("\n")}
                </div>
              )}
            </div>

            <div className="timeline">
              <div className="timeline__title">Timeline</div>
              <div className="tl-item tl-item--done">
                <div className="tl-item__marker"></div>
                <div>
                  <div className="tl-item__event">Pengajuan dibuat</div>
                  <div className="tl-item__actor">{formatRequestorName(selectedItem.requestor)}</div>
                </div>
                <div className="tl-item__time">{formatDateShort(selectedItem.created_at)}</div>
              </div>
              {selectedItem.status === "pending" ? (
                <div className="tl-item tl-item--current">
                  <div className="tl-item__marker"></div>
                  <div>
                    <div className="tl-item__event">Menunggu ACC Papi</div>
                    <div className="tl-item__actor">SLA: 1 hari tersisa</div>
                  </div>
                  <div className="tl-item__time">—</div>
                </div>
              ) : (
                <div className="tl-item tl-item--done">
                  <div className="tl-item__marker"></div>
                  <div>
                    <div className="tl-item__event">Transfer & lunas</div>
                    <div className="tl-item__actor">Admin</div>
                  </div>
                  <div className="tl-item__time">{selectedItem.resolved_at ? formatDateShort(selectedItem.resolved_at) : "—"}</div>
                </div>
              )}
            </div>

            {isAdmin && (
              <PengajuanDetailActions obligation={selectedItem} accounts={accounts} />
            )}
          </div>
        )}
      </div>
    </main>
  );
}
