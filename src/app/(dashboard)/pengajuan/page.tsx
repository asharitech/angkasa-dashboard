import { getObligations } from "@/lib/data";
import { formatRupiah } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Receipt, CheckCircle2, Clock, XCircle } from "lucide-react";

export const dynamic = "force-dynamic";

const statusConfig: Record<string, { color: string; icon: typeof Clock }> = {
  pending: { color: "bg-amber-50 text-amber-700 border-amber-200", icon: Clock },
  reimbursed: { color: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
  approved: { color: "bg-blue-50 text-blue-700 border-blue-200", icon: CheckCircle2 },
  rejected: { color: "bg-rose-50 text-rose-700 border-rose-200", icon: XCircle },
  lunas: { color: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
};

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
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold tracking-tight md:text-2xl flex items-center gap-2">
          <Receipt className="h-6 w-6 text-primary" />
          Pengajuan Papi
        </h2>
        <Badge className="bg-amber-50 text-amber-700 border-amber-200 font-semibold px-3 py-1.5">
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

        <TabsContent value="pending" className="mt-4 space-y-4">
          {Array.from(byRequestor.entries()).map(([requestor, items]) => {
            const subtotal = items.reduce((s, o) => s + (o.amount ?? 0), 0);
            return (
              <Card key={requestor} className="shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center justify-between text-base">
                    <span className="capitalize font-semibold">{requestor}</span>
                    <span className="text-sm font-medium text-muted-foreground">
                      {items.length} item · {formatRupiah(subtotal)}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1">
                  {items.map((item) => (
                    <PengajuanItem key={item._id} item={item} />
                  ))}
                </CardContent>
              </Card>
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
              <Card key={item._id} className="shadow-sm">
                <CardContent className="p-4">
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
  const config = statusConfig[item.status];

  return (
    <div className="flex items-start justify-between gap-3 rounded-lg px-3 py-3.5 transition-colors hover:bg-muted/50">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{item.item}</p>
        <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
          {item.month && (
            <span className="text-xs text-muted-foreground font-medium">
              {item.month}
            </span>
          )}
          <Badge variant="outline">
            {item.category.replace(/_/g, " ")}
          </Badge>
          {item.sumber_dana && (
            <Badge variant="outline">
              {item.sumber_dana.replace(/_/g, " ")}
            </Badge>
          )}
        </div>
        {item.detail && item.detail.length > 0 && (
          <div className="mt-2.5 ml-1 space-y-1.5 border-l-2 border-border pl-3">
            {item.detail.map((d, i) => (
              <div
                key={i}
                className="flex justify-between text-sm text-muted-foreground"
              >
                <span>{d.item}</span>
                <span className="tabular-nums font-medium">
                  {formatRupiah(d.amount)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="flex flex-col items-end gap-1.5 shrink-0">
        <span className="text-base font-bold tabular-nums">
          {item.amount ? formatRupiah(item.amount) : "-"}
        </span>
        <Badge className={`font-medium border ${config?.color ?? ""}`}>
          {item.status}
        </Badge>
      </div>
    </div>
  );
}
