import { getEntries } from "@/lib/data";
import { formatRupiah, formatDate } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function TransaksiPage() {
  const entries = await getEntries({}, 100);

  // Group by date
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
    <div className="space-y-4">
      <h2 className="text-lg font-semibold md:text-xl">Transaksi</h2>

      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-3">
            <p className="text-[10px] text-muted-foreground">Total Masuk</p>
            <p className="text-sm font-bold tabular-nums text-green-600">
              {formatRupiah(totalIn)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <p className="text-[10px] text-muted-foreground">Total Keluar</p>
            <p className="text-sm font-bold tabular-nums text-red-600">
              {formatRupiah(totalOut)}
            </p>
          </CardContent>
        </Card>
      </div>

      {entries.length === 0 ? (
        <p className="text-sm text-muted-foreground">Belum ada transaksi.</p>
      ) : (
        Array.from(byDate.entries()).map(([date, items]) => (
          <div key={date}>
            <p className="mb-2 text-xs font-medium text-muted-foreground sticky top-0 bg-background py-1">
              {formatDate(date)}
            </p>
            <Card>
              <CardContent className="divide-y">
                {items.map((entry) => (
                  <div
                    key={entry._id}
                    className="flex items-start gap-3 py-3 first:pt-4 last:pb-4"
                  >
                    <div className="mt-0.5">
                      {entry.direction === "out" ? (
                        <ArrowUpRight className="h-4 w-4 text-red-500" />
                      ) : (
                        <ArrowDownLeft className="h-4 w-4 text-green-500" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium truncate">
                        {entry.description}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {entry.counterparty}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        <Badge variant="outline" className="text-[9px] px-1">
                          {entry.domain}
                        </Badge>
                        <Badge variant="outline" className="text-[9px] px-1">
                          {entry.category.replace(/_/g, " ")}
                        </Badge>
                        <Badge variant="outline" className="text-[9px] px-1">
                          {entry.account.replace(/_/g, " ")}
                        </Badge>
                      </div>
                    </div>
                    <span
                      className={`text-xs font-semibold tabular-nums shrink-0 ${
                        entry.direction === "out"
                          ? "text-red-500"
                          : "text-green-500"
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
