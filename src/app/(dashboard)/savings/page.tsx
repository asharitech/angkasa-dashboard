import { getEntries } from "@/lib/data";
import { formatRupiah, formatDateShort } from "@/lib/format";
import { idString } from "@/lib/utils";
import { SectionCard } from "@/components/section-card";
import { PiggyBank } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SavingsPage() {
  const entries = await getEntries({ category: "savings" }, 100);

  const totalOut = entries
    .filter((e) => e.direction === "out")
    .reduce((s, e) => s + e.amount, 0);

  const totalIn = entries
    .filter((e) => e.direction === "in")
    .reduce((s, e) => s + e.amount, 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-bold tracking-tight md:text-2xl flex items-center gap-2">
          <PiggyBank className="h-6 w-6 text-primary shrink-0" />
          Savings
        </h2>
      </div>

      <SectionCard title="Total Tabungan" tone="success" bodyClassName="py-3">
        <p className="text-2xl font-extrabold tabular-nums text-success">
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
                  <span
                    className={`text-sm font-bold tabular-nums shrink-0 ${
                      isOut ? "text-success" : "text-destructive"
                    }`}
                  >
                    {isOut ? "+" : "-"}{formatRupiah(entry.amount)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
