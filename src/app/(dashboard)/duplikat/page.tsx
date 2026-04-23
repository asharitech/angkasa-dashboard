import { findDuplicateEntries } from "@/lib/data";
import { formatRupiah, formatDate } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { PeriodPicker } from "@/components/period-picker";
import { SectionCard } from "@/components/section-card";
import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { toneBadge } from "@/lib/colors";
import { cn } from "@/lib/utils";
import { AlertTriangle, CheckCircle2, Info } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DuplikatPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const { period } = await searchParams;
  const dupes = await findDuplicateEntries({ period });

  return (
    <div className="space-y-5">
      <PageHeader icon={AlertTriangle} title="Cek Duplikat">
        <Badge
          className={cn(
            "font-semibold",
            dupes.length === 0 ? toneBadge.success : toneBadge.warning,
          )}
        >
          {dupes.length} grup
        </Badge>
      </PageHeader>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Info className="h-3.5 w-3.5" />
        <p>
          Heuristik: tanggal + jumlah + arah (in/out) sama. Bukan semua duplikat — perlu cek
          manual.
        </p>
      </div>

      <PeriodPicker basePath="/duplikat" current={period} />

      {dupes.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          tone="success"
          title="Tidak ada potensi duplikat"
          description="500 entry terbaru sudah dicek."
        />
      ) : (
        <div className="space-y-3">
          {dupes.map((group) => (
            <SectionCard
              key={group.key}
              tone="warning"
              className="border-amber-200"
              title={`${formatDate(group.date)} · ${formatRupiah(group.amount)}`}
              badge={
                <Badge variant="outline" className="ml-1 text-xs">
                  {group.entries[0].direction} · {group.entries.length} mirip
                </Badge>
              }
            >
              <ul className="divide-y divide-border/60">
                {group.entries.map((e) => (
                  <li
                    key={typeof e._id === "string" ? e._id : e._id.toString()}
                    className="py-2.5 text-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="flex-1 truncate font-medium">{e.description}</p>
                      <span className="shrink-0 text-xs text-muted-foreground">{e.account}</span>
                    </div>
                    {e.counterparty && (
                      <p className="truncate text-xs text-muted-foreground">{e.counterparty}</p>
                    )}
                    <div className="mt-1 flex flex-wrap gap-1">
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
                  </li>
                ))}
              </ul>
            </SectionCard>
          ))}
        </div>
      )}
    </div>
  );
}
