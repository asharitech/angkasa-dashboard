import { getLedger, getLaporanOpReconciliation } from "@/lib/data";
import { formatRupiah, formatDate } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { KpiStrip, type KpiItem } from "@/components/kpi-strip";
import { SectionCard } from "@/components/section-card";
import { EmptyState } from "@/components/empty-state";
import { DataTable } from "@/components/data-table";
import { Card, CardContent } from "@/components/ui/card";
import {
  FileText,
  TrendingUp,
  TrendingDown,
  Scale,
  Banknote,
  GitCompare,
  Receipt,
  Inbox,
} from "lucide-react";

export const dynamic = "force-dynamic";

type EntryRow = { no: number; keterangan: string; masuk: number; keluar: number; saldo: number };

export default async function LaporanOpPage() {
  const [ledger, recon] = await Promise.all([
    getLedger("laporan_op"),
    getLaporanOpReconciliation(),
  ]);

  if (!ledger?.laporan_op) {
    return (
      <div className="space-y-5">
        <PageHeader icon={FileText} title="Laporan Operasional" />
        <EmptyState
          icon={Inbox}
          title="Laporan Op belum tersedia"
          description="Snapshot ledger belum di-publish."
        />
      </div>
    );
  }

  const { entries, totals, kewajiban, dana_efektif } = ledger.laporan_op;
  const reconHasDiff = recon && (recon.diffMasuk !== 0 || recon.diffKeluar !== 0);

  const kpis: KpiItem[] = [
    {
      label: "Total Masuk",
      value: formatRupiah(totals.masuk),
      icon: TrendingUp,
      tone: "success",
    },
    {
      label: "Total Keluar",
      value: formatRupiah(totals.keluar),
      icon: TrendingDown,
      tone: "danger",
    },
    {
      label: "Saldo",
      value: formatRupiah(totals.saldo),
      icon: Scale,
      tone: "info",
    },
    {
      label: "Dana Efektif",
      value: formatRupiah(dana_efektif),
      icon: Banknote,
      tone: "primary",
    },
  ];

  const kRows = kewajibanRows(kewajiban);

  return (
    <div className="space-y-5">
      <PageHeader icon={FileText} title="Laporan Operasional">
        {ledger.as_of && (
          <span className="text-xs text-muted-foreground">per {formatDate(ledger.as_of)}</span>
        )}
      </PageHeader>

      {/* Reconciliation — promoted to top when diff exists */}
      {reconHasDiff && recon && (
        <SectionCard
          icon={GitCompare}
          title="Rekonsiliasi: Ledger vs Entries"
          tone="warning"
          className="border-amber-200 bg-amber-50/30"
        >
          <p className="mb-2 text-xs text-muted-foreground">
            Snapshot Laporan Op vs hitungan live (account: btn_yayasan).
          </p>
          <div className="space-y-1.5">
            <ReconRow
              label="Masuk"
              ledger={recon.ledgerMasuk}
              entries={recon.entriesMasuk}
              diff={recon.diffMasuk}
            />
            <ReconRow
              label="Keluar"
              ledger={recon.ledgerKeluar}
              entries={recon.entriesKeluar}
              diff={recon.diffKeluar}
            />
          </div>
          <p className="mt-3 text-xs italic text-muted-foreground">
            Selisih bukan error — Laporan Op adalah snapshot manual. Update via mongo_helper bila
            perlu.
          </p>
        </SectionCard>
      )}

      <KpiStrip items={kpis} cols={4} />

      {/* Kewajiban */}
      <SectionCard
        icon={Receipt}
        title="Kewajiban"
        tone="danger"
        badge={
          <span className="ml-1 text-sm font-bold tabular-nums text-rose-600">
            {formatRupiah(kewajiban.total)}
          </span>
        }
      >
        <div className="space-y-1.5">
          {kRows.map(([label, val]) => (
            <div
              key={label}
              className="flex items-center justify-between rounded-md bg-muted/40 px-3 py-2"
            >
              <span className="text-sm text-muted-foreground">{label}</span>
              <span className="text-sm font-semibold tabular-nums">{formatRupiah(val)}</span>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Detail Transaksi */}
      <SectionCard
        icon={FileText}
        title={`Detail Transaksi`}
        badge={
          <span className="ml-1 text-xs text-muted-foreground">{entries.length} item</span>
        }
        bodyClassName="px-0 md:px-4"
      >
        <DataTable<EntryRow>
          minWidth={640}
          rows={entries}
          rowKey={(r) => String(r.no)}
          empty={
            <EmptyState
              icon={Inbox}
              title="Tidak ada transaksi"
              description="Ledger kosong untuk periode ini."
              className="border-none shadow-none"
            />
          }
          columns={[
            {
              key: "no",
              header: "#",
              cell: (r) => <span className="text-muted-foreground">{r.no}</span>,
              className: "w-12",
            },
            {
              key: "keterangan",
              header: "Keterangan",
              cell: (r) => (
                <span className="block whitespace-normal break-words md:max-w-[260px] md:truncate">
                  {r.keterangan}
                </span>
              ),
            },
            {
              key: "masuk",
              header: "Masuk",
              align: "right",
              cell: (r) =>
                r.masuk > 0 ? (
                  <span className="font-semibold text-emerald-600">{formatRupiah(r.masuk)}</span>
                ) : (
                  ""
                ),
            },
            {
              key: "keluar",
              header: "Keluar",
              align: "right",
              cell: (r) =>
                r.keluar > 0 ? (
                  <span className="font-semibold text-rose-600">{formatRupiah(r.keluar)}</span>
                ) : (
                  ""
                ),
            },
            {
              key: "saldo",
              header: "Saldo",
              align: "right",
              cell: (r) => <span className="font-bold">{formatRupiah(r.saldo)}</span>,
            },
          ]}
        />
      </SectionCard>
    </div>
  );
}

function ReconRow({
  label,
  ledger,
  entries,
  diff,
}: {
  label: string;
  ledger: number;
  entries: number;
  diff: number;
}) {
  return (
    <Card className="border-none bg-white/60 shadow-none">
      <CardContent className="grid grid-cols-4 gap-2 py-2 text-xs">
        <div className="font-semibold">{label}</div>
        <div className="text-right">
          <p className="text-[10px] uppercase text-muted-foreground">Ledger</p>
          <p className="tabular-nums">{formatRupiah(ledger)}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase text-muted-foreground">Entries</p>
          <p className="tabular-nums">{formatRupiah(entries)}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase text-muted-foreground">Selisih</p>
          <p
            className={`font-bold tabular-nums ${diff !== 0 ? "text-amber-700" : "text-emerald-700"}`}
          >
            {diff > 0 ? "+" : ""}
            {formatRupiah(diff)}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function kewajibanRows(k: {
  total: number;
  dana_pinjam_angkasa_tahap1?: number;
  dana_pinjam_angkasa_tahap2?: number;
  dana_pinjam_angkasa_tahap3?: number;
  lembar2_btn?: number;
  pinjaman_btn?: number;
}): [string, number][] {
  const ka = k as Record<string, number | undefined>;
  if (ka.dana_pinjam_angkasa_tahap1 != null) {
    return ([
      ["Dana Pinjam Angkasa Tahap 1", ka.dana_pinjam_angkasa_tahap1],
      ["Dana Pinjam Angkasa Tahap 2", ka.dana_pinjam_angkasa_tahap2],
      ["Dana Pinjam Angkasa Tahap 3", ka.dana_pinjam_angkasa_tahap3],
      ["Total", k.total],
    ] as [string, number | undefined][]).filter((r): r is [string, number] => r[1] != null);
  }
  return ([
    ["Lembar2 BTN", ka.lembar2_btn],
    ["Pinjaman BTN", ka.pinjaman_btn],
    ["Total", k.total],
  ] as [string, number | undefined][]).filter((r): r is [string, number] => r[1] != null);
}
