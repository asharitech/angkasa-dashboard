import { getObligations } from "@/lib/data";
import { formatRupiah } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Receipt } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function PengajuanPage() {
  const all = await getObligations({ type: "pengajuan" });

  const pending = all.filter((o) => o.status === "pending");
  const resolved = all.filter((o) => o.status !== "pending");

  const byRequestor = new Map<string, typeof pending>();
  for (const item of pending) {
    const key = item.requestor ?? "unknown";
    if (!byRequestor.has(key)) byRequestor.set(key, []);
    byRequestor.get(key)!.push(item);
  }

  const pendingTotal = pending.reduce((s, o) => s + (o.amount ?? 0), 0);

  return (
    <div className="space-y-6">
      <PageHeader icon={Receipt} title="Pengajuan">
        <Badge className="bg-amber-50 text-amber-700 border-amber-200 font-semibold px-3 py-1.5">
          {pending.length} pending · {formatRupiah(pendingTotal)}
        </Badge>
      </PageHeader>

      {/* Requestor summary */}
      {byRequestor.size > 0 && (
        <div className="grid grid-cols-2 gap-2.5 md:grid-cols-3">
          {Array.from(byRequestor.entries()).map(([requestor, items]) => {
            const subtotal = items.reduce((s, o) => s + (o.amount ?? 0), 0);
            return (
              <div key={requestor} className="rounded-xl bg-amber-50/50 px-4 py-3">
                <p className="text-xs text-muted-foreground capitalize">{requestor}</p>
                <p className="text-base font-bold tabular-nums mt-0.5">{formatRupiah(subtotal)}</p>
                <p className="text-xs text-muted-foreground">{items.length} item</p>
              </div>
            );
          })}
        </div>
      )}

      <Tabs defaultValue="pending">
        <TabsList className="w-full md:w-auto">
          <TabsTrigger value="pending" className="flex-1 md:flex-initial">
            Pending ({pending.length})
          </TabsTrigger>
          <TabsTrigger value="resolved" className="flex-1 md:flex-initial">
            Selesai ({resolved.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-4 space-y-4">
          {Array.from(byRequestor.entries()).map(([requestor, items]) => {
            const subtotal = items.reduce((s, o) => s + (o.amount ?? 0), 0);
            return (
              <div key={requestor} className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground capitalize">
                    {requestor}
                  </h3>
                  <span className="text-sm font-semibold text-muted-foreground tabular-nums">
                    {items.length} item · {formatRupiah(subtotal)}
                  </span>
                </div>
                {items.map((item) => (
                  <PengajuanCard key={item._id} item={item} />
                ))}
              </div>
            );
          })}
        </TabsContent>

        <TabsContent value="resolved" className="mt-4 space-y-2">
          {resolved.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Belum ada yang selesai.
            </p>
          ) : (
            resolved.map((item) => (
              <PengajuanCard key={item._id} item={item} />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function PengajuanCard({
  item,
}: {
  item: {
    _id: string;
    item: string;
    amount: number | null;
    month?: string | null;
    category: string;
    sumber_dana?: string | null;
    status: string;
    detail?: { item: string; amount: number }[] | null;
  };
}) {
  return (
    <Card className="shadow-sm">
      <CardContent className="p-4 space-y-3">
        {/* Top row: name + amount */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold leading-snug">{item.item}</p>
            <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
              <StatusBadge status={item.status} />
              <Badge variant="outline">
                {item.category.replace(/_/g, " ")}
              </Badge>
              {item.month && (
                <Badge variant="outline">{item.month}</Badge>
              )}
              {item.sumber_dana && (
                <Badge variant="outline">
                  {item.sumber_dana.replace(/_/g, " ")}
                </Badge>
              )}
            </div>
          </div>
          <span className="text-base font-bold tabular-nums shrink-0">
            {item.amount ? formatRupiah(item.amount) : "-"}
          </span>
        </div>

        {/* Detail breakdown */}
        {item.detail && item.detail.length > 0 && (
          <div className="rounded-lg bg-muted/50 p-3 space-y-1.5">
            {item.detail.map((d, i) => (
              <div
                key={i}
                className="flex justify-between text-sm"
              >
                <span className="text-muted-foreground">{d.item}</span>
                <span className="tabular-nums font-medium">
                  {formatRupiah(d.amount)}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
