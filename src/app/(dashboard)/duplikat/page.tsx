import { findDuplicateEntries } from "@/lib/data";
import { formatRupiah, formatDate } from "@/lib/format";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { PeriodPicker } from "@/components/period-picker";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DuplikatPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const { period } = await searchParams;
  const dupes = await findDuplicateEntries({ period });

  return (
    <div className="space-y-6">
      <PageHeader icon={AlertTriangle} title="Cek Duplikat">
        <Badge
          className={
            dupes.length === 0
              ? "bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold px-3 py-1.5"
              : "bg-amber-50 text-amber-700 border-amber-200 font-semibold px-3 py-1.5"
          }
        >
          {dupes.length} grup ditemukan
        </Badge>
      </PageHeader>

      <PeriodPicker basePath="/duplikat" current={period} />

      <p className="text-xs text-muted-foreground px-1">
        Heuristik: entry dengan tanggal, jumlah, dan arah (in/out) yang sama
        digrupkan. Bukan semua duplikat — perlu cek manual.
      </p>

      {dupes.length === 0 ? (
        <Card className="shadow-sm border-emerald-100 bg-emerald-50/30">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <CheckCircle2 className="h-10 w-10 text-emerald-500 mb-3" />
            <p className="text-sm font-semibold text-emerald-700">
              Tidak ada potensi duplikat
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              500 entry terbaru sudah dicek.
            </p>
          </CardContent>
        </Card>
      ) : (
        dupes.map((group) => (
          <Card key={group.key} className="shadow-sm border-amber-200">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">
                    {formatDate(group.date)} · {formatRupiah(group.amount)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {group.entries.length} entry mirip
                  </p>
                </div>
                <Badge variant="outline" className="text-xs">
                  {group.entries[0].direction}
                </Badge>
              </div>
              <div className="space-y-1.5">
                {group.entries.map((e) => (
                  <div
                    key={e._id}
                    className="rounded-lg bg-muted/50 px-3 py-2 text-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium truncate flex-1">{e.description}</p>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {e.account}
                      </span>
                    </div>
                    {e.counterparty && (
                      <p className="text-xs text-muted-foreground truncate">
                        {e.counterparty}
                      </p>
                    )}
                    <div className="flex gap-1.5 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {e.domain}
                      </Badge>
                      {e.owner && (
                        <Badge variant="outline" className="text-xs">
                          {e.owner}
                        </Badge>
                      )}
                      {e.category && (
                        <Badge variant="outline" className="text-xs">
                          {e.category.replace(/_/g, " ")}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
