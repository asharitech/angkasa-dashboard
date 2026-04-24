import { getLedger, getLaporanOpReconciliation } from "@/lib/data";
import { formatRupiah, formatDate } from "@/lib/format";
import { kewajibanRows } from "@/lib/kewajiban-display";
import { PageHeader } from "@/components/page-header";
import { KpiStrip, type KpiItem } from "@/components/kpi-strip";
import { SectionCard } from "@/components/section-card";
import { EmptyState } from "@/components/empty-state";
import { DataTable } from "@/components/data-table";
import { StatRowRupiah } from "@/components/stat-row";
import { Badge } from "@/components/ui/badge";
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

  const kRows = kewajibanRows(kewajiban, { includeTotal: true });

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
          className="border-warning/20 bg-warning/10"
        >
          <p className="mb-2 text-xs text-muted-foreground">
            Snapshot Laporan Op vs hitungan live (account: btn_yayasan).
          </p>
          <div className="divide-y divide-warning/20">
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
          <Badge variant="destructive" className="ml-1 tabular-nums">
            {formatRupiah(kewajiban.total)}
          </Badge>
        }
      >
        <div className="divide-y divide-border/60">
          {kRows.map(([label, val]) => (
            <StatRowRupiah
              key={label}
              label={label}
              amount={val}
              variant={label === "Total" ? "total" : "default"}
            />
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
              embedded
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
                  <span className="font-semibold text-success">{formatRupiah(r.masuk)}</span>
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
                  <span className="font-semibold text-destructive">{formatRupiah(r.keluar)}</span>
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
    <div className="grid grid-cols-4 gap-2 py-2.5 text-xs">
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
          className={`font-bold tabular-nums ${diff !== 0 ? "text-warning" : "text-success"}`}
        >
          {diff > 0 ? "+" : ""}
          {formatRupiah(diff)}
        </p>
      </div>
    </div>
  );
}

