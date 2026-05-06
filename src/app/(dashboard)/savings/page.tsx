import { getEntries, getAccounts } from "@/lib/dal";
import { formatRupiah, formatDateShort } from "@/lib/format";
import { idString } from "@/lib/utils";
import { SectionCard } from "@/components/section-card";
import { PageHeader } from "@/components/page-header";
import { DashboardPageShell } from "@/components/layout/dashboard-page-shell";
import { DataTable } from "@/components/data-table";
import { EmptyState } from "@/components/empty-state";
import { EntryRowActions } from "@/components/entry-row-actions";
import { Badge } from "@/components/ui/badge";
import { PiggyBank, Inbox } from "lucide-react";
import type { Entry } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function SavingsPage() {
  const [entries, accounts] = await Promise.all([
    getEntries({ category: "savings" }, 100),
    getAccounts(),
  ]);

  const totalOut = entries
    .filter((e) => e.direction === "out")
    .reduce((s, e) => s + e.amount, 0);

  const totalIn = entries
    .filter((e) => e.direction === "in")
    .reduce((s, e) => s + e.amount, 0);

  const angkasaEntries = entries.filter((e) => e.owner === "angkasa" && e.direction === "out");
  const ebaEntries = entries.filter((e) => e.owner === "eba" && e.direction === "out");
  const angkasaTotal = angkasaEntries.reduce((s, e) => s + e.amount, 0);
  const ebaTotal = ebaEntries.reduce((s, e) => s + e.amount, 0);
  const angkasaCount = angkasaEntries.length;
  const ebaCount = ebaEntries.length;

  return (
    <DashboardPageShell>
      <PageHeader icon={PiggyBank} title="Savings" />

      {/* Total per owner */}
      <div className="grid grid-cols-2 gap-3">
        <SectionCard title="Tabungan Angkasa" tone="primary" bodyClassName="py-3">
          <p className="text-2xl font-extrabold tabular-nums text-primary">
            {formatRupiah(angkasaTotal)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {angkasaCount} transaksi
          </p>
        </SectionCard>
        <SectionCard title="Tabungan Eba" tone="success" bodyClassName="py-3">
          <p className="text-2xl font-extrabold tabular-nums text-success">
            {formatRupiah(ebaTotal)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {ebaCount} transaksi
          </p>
        </SectionCard>
      </div>

      <SectionCard title="Total Keseluruhan" tone="muted" bodyClassName="py-3">
        <p className="text-xl font-extrabold tabular-nums text-foreground">
          {formatRupiah(totalOut)}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {entries.length} transaksi · {totalIn > 0 ? `masuk ${formatRupiah(totalIn)}` : ""}
        </p>
      </SectionCard>

      <SectionCard title="Riwayat Transaksi" tone="muted" bodyClassName="px-0 md:px-4">
        <DataTable<Entry>
          minWidth={560}
          rows={entries}
          rowKey={(e) => idString(e._id)}
          empty={
            <EmptyState
              icon={Inbox}
              title="Belum ada transaksi savings"
              description="Transaksi dengan kategori savings akan muncul di sini."
              embedded
            />
          }
          columns={[
            {
              key: "when",
              header: "Tanggal",
              className: "w-[7.5rem]",
              cell: (e) => (
                <span className="tabular-nums text-muted-foreground">{formatDateShort(e.date)}</span>
              ),
            },
            {
              key: "meta",
              header: "Pemilik / Arah",
              nowrap: false,
              className: "w-36",
              cell: (e) => (
                <div className="flex flex-col gap-0.5">
                  <Badge variant="outline" className="w-fit text-[10px] font-medium capitalize">
                    {e.owner ?? "—"}
                  </Badge>
                  <span className="text-[11px] text-muted-foreground">
                    {e.direction === "out" ? "Keluar" : "Masuk"}
                  </span>
                </div>
              ),
            },
            {
              key: "desc",
              header: "Keterangan",
              nowrap: false,
              cell: (e) => <span className="font-medium leading-snug">{e.description}</span>,
            },
            {
              key: "amount",
              header: "Nominal",
              align: "right",
              className: "w-44",
              cell: (e) => {
                const isOut = e.direction === "out";
                return (
                  <div className="flex items-center justify-end gap-2">
                    <span
                      className={
                        isOut
                          ? "text-sm font-bold tabular-nums text-success"
                          : "text-sm font-bold tabular-nums text-destructive"
                      }
                    >
                      {isOut ? "+" : "−"}
                      {formatRupiah(e.amount)}
                    </span>
                    <EntryRowActions entryId={idString(e._id)} accounts={accounts} />
                  </div>
                );
              },
            },
          ]}
        />
      </SectionCard>
    </DashboardPageShell>
  );
}
