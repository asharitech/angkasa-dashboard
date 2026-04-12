import { getEntries } from "@/lib/data";
import { formatRupiah, formatDate } from "@/lib/format";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SummaryCard } from "@/components/summary-card";
import { PageHeader } from "@/components/page-header";
import { TransactionIcon, AmountText } from "@/components/transaction-item";
import { ArrowLeftRight, TrendingUp, TrendingDown } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function TransaksiPage() {
  const entries = await getEntries({}, 100);

  const byDate = new Map<string, typeof entries>();
  for (const entry of entries) {
    const dateKey = new Date(entry.date).toISOString().split("T")[0];
    if (!byDate.has(dateKey)) byDate.set(dateKey, []);
    byDate.get(dateKey)!.push(entry);
  }

  const totalIn = entries
    .filter((e) => e.direction === "in")
    .reduce((s, e) => s + e.amount, 0);
  const totalOut = entries
    .filter((e) => e.direction === "out")
    .reduce((s, e) => s + e.amount, 0);

  return (
    <div className="space-y-6">
      <PageHeader icon={ArrowLeftRight} title="Transaksi" />

      <div className="grid grid-cols-2 gap-3">
        <SummaryCard
          title="Total Masuk"
          value={formatRupiah(totalIn)}
          icon={<TrendingUp className="h-5 w-5" />}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50"
          valueColor="text-emerald-600"
        />
        <SummaryCard
          title="Total Keluar"
          value={formatRupiah(totalOut)}
          icon={<TrendingDown className="h-5 w-5" />}
          iconColor="text-rose-600"
          iconBg="bg-rose-50"
          valueColor="text-rose-600"
        />
      </div>

      {entries.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-10">
          Belum ada transaksi.
        </p>
      ) : (
        Array.from(byDate.entries()).map(([date, items]) => (
          <div key={date}>
            <p className="mb-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider sticky top-0 bg-background py-2 z-10">
              {formatDate(date)}
            </p>
            <Card className="shadow-sm">
              <CardContent className="divide-y divide-border/60">
                {items.map((entry) => (
                  <div
                    key={entry._id}
                    className="flex items-start gap-3.5 py-4 first:pt-5 last:pb-5"
                  >
                    <div className="mt-0.5">
                      <TransactionIcon direction={entry.direction} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold truncate">
                        {entry.description}
                      </p>
                      {entry.counterparty && (
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {entry.counterparty}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        <Badge variant="outline">{entry.domain}</Badge>
                        {entry.category && (
                          <Badge variant="outline">
                            {entry.category.replace(/_/g, " ")}
                          </Badge>
                        )}
                        {entry.account && (
                          <Badge variant="outline">
                            {entry.account.replace(/_/g, " ")}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <AmountText
                      amount={entry.amount}
                      direction={entry.direction}
                      formatter={formatRupiah}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        ))
      )}
    </div>
  );
}
