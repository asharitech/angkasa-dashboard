import { getObligations } from "@/lib/data";
import { formatRupiah } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const dynamic = "force-dynamic";

export default async function PengajuanPage() {
  const all = await getObligations({ type: "pengajuan" });

  const pending = all.filter((o) => o.status === "pending");
  const resolved = all.filter((o) => o.status !== "pending");

  // Group pending by requestor
  const byRequestor = new Map<string, typeof pending>();
  for (const item of pending) {
    const key = item.requestor ?? "unknown";
    if (!byRequestor.has(key)) byRequestor.set(key, []);
    byRequestor.get(key)!.push(item);
  }

  const pendingTotal = pending.reduce((s, o) => s + (o.amount ?? 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold md:text-xl">Pengajuan Papi</h2>
        <Badge variant="secondary" className="text-xs">
          {pending.length} pending · {formatRupiah(pendingTotal)}
        </Badge>
      </div>

      <Tabs defaultValue="pending">
        <TabsList className="w-full md:w-auto">
          <TabsTrigger value="pending" className="flex-1 md:flex-initial">
            Pending ({pending.length})
          </TabsTrigger>
          <TabsTrigger value="resolved" className="flex-1 md:flex-initial">
            Selesai ({resolved.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-3 space-y-4">
          {Array.from(byRequestor.entries()).map(([requestor, items]) => {
            const subtotal = items.reduce((s, o) => s + (o.amount ?? 0), 0);
            return (
              <Card key={requestor}>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center justify-between text-sm">
                    <span className="capitalize">{requestor}</span>
                    <span className="text-xs font-normal text-muted-foreground">
                      {items.length} item · {formatRupiah(subtotal)}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {items.map((item) => (
                    <PengajuanItem key={item._id} item={item} />
                  ))}
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        <TabsContent value="resolved" className="mt-3 space-y-2">
          {resolved.length === 0 ? (
            <p className="text-sm text-muted-foreground">Belum ada yang selesai.</p>
          ) : (
            resolved.map((item) => (
              <Card key={item._id}>
                <CardContent className="p-3">
                  <PengajuanItem item={item} />
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function PengajuanItem({
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
  const statusColor: Record<string, string> = {
    pending: "bg-amber-100 text-amber-800",
    reimbursed: "bg-green-100 text-green-800",
    approved: "bg-blue-100 text-blue-800",
    rejected: "bg-red-100 text-red-800",
    lunas: "bg-green-100 text-green-800",
  };

  return (
    <div className="flex items-start justify-between gap-2 py-1">
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium">{item.item}</p>
        <div className="flex flex-wrap items-center gap-1 mt-0.5">
          {item.month && (
            <span className="text-[10px] text-muted-foreground">
              {item.month}
            </span>
          )}
          <Badge variant="outline" className="text-[9px] px-1">
            {item.category.replace(/_/g, " ")}
          </Badge>
          {item.sumber_dana && (
            <Badge variant="outline" className="text-[9px] px-1">
              {item.sumber_dana.replace(/_/g, " ")}
            </Badge>
          )}
        </div>
        {item.detail && item.detail.length > 0 && (
          <div className="mt-1 ml-2 space-y-0.5">
            {item.detail.map((d, i) => (
              <div key={i} className="flex justify-between text-[10px] text-muted-foreground">
                <span>{d.item}</span>
                <span className="tabular-nums">{formatRupiah(d.amount)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="flex flex-col items-end gap-1 shrink-0">
        <span className="text-xs font-semibold tabular-nums">
          {item.amount ? formatRupiah(item.amount) : "-"}
        </span>
        <Badge
          className={`text-[9px] px-1.5 ${statusColor[item.status] ?? ""}`}
          variant="secondary"
        >
          {item.status}
        </Badge>
      </div>
    </div>
  );
}
