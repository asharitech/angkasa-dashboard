import { getEntries, getAccounts } from "@/lib/data";
import { formatRupiah, formatDateShort } from "@/lib/format";
import { idString } from "@/lib/utils";
import { SectionCard } from "@/components/section-card";
import { PageHeader } from "@/components/page-header";
import { DashboardPageShell } from "@/components/layout/dashboard-page-shell";
import { EntryRowActions } from "@/components/entry-row-actions";
import { PiggyBank } from "lucide-react";

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

      <SectionCard title="Riwayat Transaksi" tone="muted">
        {entries.length === 0 ? (
          <p className="text-center text-muted-foreground py-8 text-sm">Belum ada transaksi savings.</p>
        ) : (
          <div className="divide-y divide-border/50">
            {entries.map((entry) => {
              const isOut = entry.direction === "out";
              return (
                <div key={idString(entry._id)} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold truncate">{entry.description}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatDateShort(entry.date)} · {entry.owner}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`text-sm font-bold tabular-nums ${
                        isOut ? "text-success" : "text-destructive"
                      }`}
                    >
                      {isOut ? "+" : "-"}{formatRupiah(entry.amount)}
                    </span>
                    <EntryRowActions entryId={idString(entry._id)} accounts={accounts} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>
    </DashboardPageShell>
  );
}
