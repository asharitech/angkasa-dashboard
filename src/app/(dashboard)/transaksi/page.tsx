import { getEntries } from "@/lib/data";
import { formatRupiah, formatDate } from "@/lib/format";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
      <h2 className="text-xl font-semibold tracking-tight md:text-2xl flex items-center gap-2">
        <ArrowLeftRight className="h-6 w-6 text-primary" />
        Transaksi
      </h2>

      <div className="grid grid-cols-2 gap-3">
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <span className="text-xs font-medium text-muted-foreground">Total Masuk</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50">
                <TrendingUp className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
            <p className="mt-2 text-lg font-bold tabular-nums text-emerald-600">
              {formatRupiah(totalIn)}
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <span className="text-xs font-medium text-muted-foreground">Total Keluar</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50">
                <TrendingDown className="h-5 w-5 text-rose-600" />
              </div>
            </div>
            <p className="mt-2 text-lg font-bold tabular-nums text-rose-600">
              {formatRupiah(totalOut)}
            </p>
          </CardContent>
        </Card>
      </div>

      {entries.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-10">
          Belum ada transaksi.
        </p>
      ) : (
        Array.from(byDate.entries()).map(([date, items]) => (
          <div key={date}>
            <p className="mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider sticky top-0 bg-background py-1.5 z-10">
              {formatDate(date)}
            </p>
            <Card className="shadow-sm">
              <CardContent className="divide-y divide-border/60">
                {items.map((entry) => (
                  <div
                    key={entry._id}
                    className="flex items-start gap-3 py-3.5 first:pt-4 last:pb-4"
                  >
                    <div
                      className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                        entry.direction === "out"
                          ? "bg-rose-50 text-rose-500"
                          : "bg-emerald-50 text-emerald-500"
                      }`}
                    >
                      {entry.direction === "out" ? (
                        <TrendingDown className="h-4.5 w-4.5" />
                      ) : (
                        <TrendingUp className="h-4.5 w-4.5" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold truncate">
                        {entry.description}
                      </p>
                      {entry.counterparty && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {entry.counterparty}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        <Badge variant="outline" className="text-[10px] px-1.5 font-medium">
                          {entry.domain}
                        </Badge>
                        <Badge variant="outline" className="text-[10px] px-1.5 font-medium">
                          {entry.category.replace(/_/g, " ")}
                        </Badge>
                        <Badge variant="outline" className="text-[10px] px-1.5 font-medium">
                          {entry.account.replace(/_/g, " ")}
                        </Badge>
                      </div>
                    </div>
                    <span
                      className={`text-sm font-bold tabular-nums shrink-0 ${
                        entry.direction === "out"
                          ? "text-rose-600"
                          : "text-emerald-600"
                      }`}
                    >
                      {entry.direction === "out" ? "-" : "+"}
                      {formatRupiah(entry.amount)}
                    </span>
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
