import Link from "next/link";
import { getObligations, getAccounts } from "@/lib/data";
import { getSession } from "@/lib/auth";
import { formatRupiah, formatDateShort } from "@/lib/format";
import { formatRequestorName } from "@/lib/names";
import { currentWitaMonth } from "@/lib/periods";
import { cn } from "@/lib/utils";
import { History, Search, Filter } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { ToneBadge } from "@/components/tone-badge";
import { ExportButton } from "@/components/export-button";
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
        <ExportButton data={allInScope} filename={`pengajuan-${monthView}`} />
        {isAdmin && <PengajuanCreateButton />}
      </PageHeader>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-5 rounded-2xl border border-ink-100 shadow-sm transition-all hover:shadow-md">
          <div className="text-[10px] font-bold uppercase tracking-widest text-ink-400 mb-1">Pending</div>
          <div className="text-3xl font-bold text-warn-700 tracking-tight">{pendingItems.length}</div>
          <div className="text-[11px] font-medium text-ink-500 mt-1">Action required</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-ink-100 shadow-sm transition-all hover:shadow-md">
          <div className="text-[10px] font-bold uppercase tracking-widest text-ink-400 mb-1">Nominal Pending</div>
          <div className="text-2xl font-bold text-warn-700 font-mono tracking-tighter truncate">{formatRupiah(totalPending)}</div>
          <div className="text-[11px] font-medium text-ink-500 mt-1">Estimasi outflow</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-ink-100 shadow-sm transition-all hover:shadow-md">
          <div className="text-[10px] font-bold uppercase tracking-widest text-ink-400 mb-1">Lunas</div>
          <div className="text-3xl font-bold text-pos-700 tracking-tight">{lunasItems.length}</div>
          <div className="text-[11px] font-medium text-ink-500 mt-1">Selesai ditransfer</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-ink-100 shadow-sm transition-all hover:shadow-md">
          <div className="text-[10px] font-bold uppercase tracking-widest text-ink-400 mb-1">Total Realisasi</div>
          <div className="text-2xl font-bold text-ink-900 font-mono tracking-tighter truncate">{formatRupiah(totalLunas)}</div>
          <div className="text-[11px] font-medium text-ink-500 mt-1">Dana keluar {monthView}</div>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="flex flex-col lg:flex-row gap-4 mb-6 items-start lg:items-center justify-between">
        <div className="flex bg-white p-1 rounded-xl border border-ink-100 shadow-sm">
          <Link href="?statusView=pending" className={cn(
            "px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2",
            statusView === "pending" ? "bg-ink-900 text-white shadow-md" : "text-ink-500 hover:bg-ink-050"
          )}>
            Pending <span className={cn("text-[10px] font-mono px-1.5 py-0.5 rounded-full", statusView === "pending" ? "bg-white/20" : "bg-ink-050")}>{pendingItems.length}</span>
          </Link>
          <Link href="?statusView=lunas" className={cn(
            "px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2",
            statusView === "lunas" ? "bg-ink-900 text-white shadow-md" : "text-ink-500 hover:bg-ink-050"
          )}>
            Disetujui <span className={cn("text-[10px] font-mono px-1.5 py-0.5 rounded-full", statusView === "lunas" ? "bg-white/20" : "bg-ink-050")}>{lunasItems.length}</span>
          </Link>
          <Link href="?statusView=semua" className={cn(
            "px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2",
            statusView === "semua" ? "bg-ink-900 text-white shadow-md" : "text-ink-500 hover:bg-ink-050"
          )}>
            Semua <span className={cn("text-[10px] font-mono px-1.5 py-0.5 rounded-full", statusView === "semua" ? "bg-white/20" : "bg-ink-050")}>{allInScope.length}</span>
          </Link>
        </div>

        <div className="flex items-center gap-3 w-full lg:w-auto">
          <div className="input__wrap flex-1 lg:w-64 focus-within:ring-2 focus-within:ring-accent-100 transition-all">
            <Search className="input__icon" />
            <input placeholder="Cari..." className="w-full" />
          </div>
          <button className="btn btn--secondary group">
            <Filter className="btn__icon group-hover:text-accent-700" />
            <span className="hidden sm:inline">Filter</span>
          </button>
        </div>
      </div>

      <div className="two-col">
        {/* Main list */}
        <div className="bg-white rounded-xl border border-ink-100 shadow-sm overflow-hidden flex flex-col h-fit">
          <div className="grid grid-cols-[40px_80px_1fr_120px_100px_120px] gap-4 px-5 py-3 bg-ink-025 border-b border-ink-050 text-[10px] font-bold uppercase tracking-widest text-ink-400">
            <div className="flex justify-center"><div className="w-4 h-4 border border-ink-200 rounded"></div></div>
            <div>Kode</div>
            <div>Requester · Keterangan</div>
            <div>Kategori</div>
            <div>Status</div>
            <div className="text-right">Jumlah</div>
          </div>

          <div className="divide-y divide-ink-050 overflow-y-auto max-h-[calc(100vh-400px)]">
            {activeItems.map((o) => {
              const isSelected = selectedItem?._id === o._id;
              const name = formatRequestorName(o.requestor);
              const initials = name.substring(0, 2).toUpperCase();
              const tone = o.status === "lunas" ? "pos" : o.status === "pending" ? "warn" : "neg";
              const toneLabel = o.status === "lunas" ? "Lunas" : o.status === "pending" ? "Menunggu" : "Ditolak";

              return (
                <Link
                  href={`?statusView=${statusView}${monthView !== currentWitaMonth() ? "&monthView=" + monthView : ""}&selected=${o._id}`}
                  className={cn(
                    "grid grid-cols-[40px_80px_1fr_120px_100px_120px] gap-4 px-5 py-4 items-center transition-all group",
                    isSelected ? "bg-accent-050/50 border-l-4 border-l-accent-700" : "hover:bg-ink-025 border-l-4 border-l-transparent"
                  )}
                  key={o._id}
                >
                  <div className="flex justify-center">
                    <div className={cn("w-4 h-4 border rounded transition-colors flex items-center justify-center", isSelected ? "bg-accent-700 border-accent-700" : "border-ink-200 group-hover:border-ink-400")}>
                      {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                    </div>
                  </div>
                  <div className="font-mono text-xs font-bold text-ink-400 group-hover:text-ink-900 transition-colors">PJ-{o._id.substring(o._id.length - 4)}</div>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-ink-050 border border-ink-100 flex items-center justify-center text-[10px] font-bold text-ink-700 group-hover:bg-white group-hover:border-accent-200 transition-all">{initials}</div>
                    <div className="truncate">
                      <div className="font-bold text-ink-900 text-sm group-hover:text-accent-900 transition-colors">{name}</div>
                      <div className="text-xs text-ink-400 truncate">{o.item}</div>
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-tighter bg-ink-050 px-2 py-0.5 rounded-full border border-ink-100 text-ink-500">{o.category || "lainnya"}</span>
                  </div>
                  <div>
                    <ToneBadge tone={tone} className="text-[10px]">{toneLabel}</ToneBadge>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-bold text-ink-900 text-sm">{formatRupiah(o.amount || 0)}</div>
                    <div className="text-[10px] font-mono text-ink-400">{formatDateShort(o.created_at)}</div>
                  </div>
                </Link>
              );
            })}
          </div>
          
          {activeItems.length === 0 && (
            <div className="p-12 text-center text-ink-400 italic bg-ink-025/30">Tidak ada pengajuan ditemukan.</div>
          )}
        </div>

        {/* Detail panel */}
        {selectedItem && (
          <div className="bg-white rounded-xl border border-ink-100 shadow-lg overflow-hidden sticky top-24 h-fit transition-all duration-300">
            <div className="p-6 border-b border-ink-050 bg-ink-025/30">
              <div className="flex justify-between items-center mb-4">
                <span className="font-mono text-xs font-bold text-ink-400 tracking-widest uppercase px-2 py-1 bg-white rounded border border-ink-100 shadow-sm">PJ-{selectedItem._id.substring(selectedItem._id.length - 4)}</span>
                <ToneBadge tone={selectedItem.status === "lunas" ? "pos" : "warn"} className="text-[10px] font-bold">
                  {selectedItem.status === "lunas" ? "REALISASI LUNAS" : "MENUNGGU PERSETUJUAN"}
                </ToneBadge>
              </div>
              <div className="text-xl font-bold text-ink-900 leading-tight mb-2">{selectedItem.item}</div>
              <div className="text-3xl font-bold text-ink-900 font-mono tracking-tighter">{formatRupiah(selectedItem.amount || 0)}</div>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-[100px_1fr] gap-4 items-baseline">
                <div className="text-[10px] font-bold uppercase tracking-wider text-ink-400">Requester</div>
                <div className="text-sm font-bold text-ink-700">{formatRequestorName(selectedItem.requestor)}</div>
              </div>
              <div className="grid grid-cols-[100px_1fr] gap-4 items-baseline">
                <div className="text-[10px] font-bold uppercase tracking-wider text-ink-400">Kategori</div>
                <div className="text-sm font-bold text-ink-700 capitalize">{selectedItem.category?.replace(/_/g, " ")}</div>
              </div>
              <div className="grid grid-cols-[100px_1fr] gap-4 items-baseline">
                <div className="text-[10px] font-bold uppercase tracking-wider text-ink-400">Sumber Dana</div>
                <div className="text-sm font-bold text-ink-700">{selectedItem.sumber_dana || "Operasional"}</div>
              </div>
              <div className="grid grid-cols-[100px_1fr] gap-4 items-baseline">
                <div className="text-[10px] font-bold uppercase tracking-wider text-ink-400">Metode</div>
                <div className="text-sm font-bold text-ink-700">{selectedItem.bukti_type || "Transfer"}</div>
              </div>

              {selectedItem.detail && selectedItem.detail.length > 0 && (
                <div className="mt-6 p-4 bg-ink-025 rounded-xl border border-ink-100 space-y-2">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-ink-400 mb-2">Item Breakdown</div>
                  {selectedItem.detail.map((d, idx) => (
                    <div className="flex justify-between text-sm group" key={idx}>
                      <span className="text-ink-600 group-hover:text-ink-900 transition-colors">{d.item}</span>
                      <span className="font-mono font-bold text-ink-900">{formatRupiah(d.amount)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-ink-025/50 border-t border-ink-050">
              <div className="text-[10px] font-bold uppercase tracking-widest text-ink-400 mb-6">Workflow Status</div>
              <div className="space-y-6 relative before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-px before:bg-ink-100">
                <div className="flex gap-4 relative">
                  <div className="w-5 h-5 rounded-full bg-pos-500 border-4 border-white shadow-sm flex-shrink-0 z-10"></div>
                  <div className="flex-1">
                    <div className="flex justify-between items-baseline mb-1">
                      <span className="text-sm font-bold text-ink-900">Pengajuan dibuat</span>
                      <span className="font-mono text-[10px] text-ink-400">{formatDateShort(selectedItem.created_at)}</span>
                    </div>
                    <div className="text-xs text-ink-500">Oleh {formatRequestorName(selectedItem.requestor)}</div>
                  </div>
                </div>

                {selectedItem.status === "pending" ? (
                  <div className="flex gap-4 relative">
                    <div className="w-5 h-5 rounded-full bg-warn-500 border-4 border-white shadow-sm flex-shrink-0 z-10 animate-pulse"></div>
                    <div className="flex-1">
                      <div className="flex justify-between items-baseline mb-1">
                        <span className="text-sm font-bold text-ink-900">Menunggu ACC</span>
                        <span className="font-mono text-[10px] text-warn-700">IN PROGRESS</span>
                      </div>
                      <div className="text-xs text-ink-500">SLA: Diperkirakan 1-2 hari kerja</div>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-4 relative">
                    <div className="w-5 h-5 rounded-full bg-pos-500 border-4 border-white shadow-sm flex-shrink-0 z-10"></div>
                    <div className="flex-1">
                      <div className="flex justify-between items-baseline mb-1">
                        <span className="text-sm font-bold text-ink-900">Transfer & Selesai</span>
                        <span className="font-mono text-[10px] text-ink-400">{selectedItem.resolved_at ? formatDateShort(selectedItem.resolved_at) : "—"}</span>
                      </div>
                      <div className="text-xs text-ink-500">Dana telah dipindahbukukan</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {isAdmin && (
              <div className="p-6 border-t border-ink-100 bg-white">
                <PengajuanDetailActions obligation={selectedItem} accounts={accounts} />
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
