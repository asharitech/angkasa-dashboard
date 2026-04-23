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
    <main className="content">
      <div className="page-head">
        <div>
          <h1 className="page-head__title" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <AlertTriangle className="w-6 h-6" />
            Cek Duplikat
          </h1>
        </div>
        <div className="page-head__actions">
          <Badge
            className={cn(
              "font-semibold",
              dupes.length === 0 ? toneBadge.success : toneBadge.warning,
            )}
            style={{ borderRadius: "999px", padding: "4px 12px" }}
          >
            {dupes.length} grup
          </Badge>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "var(--text-xs)", color: "var(--ink-500)", marginBottom: "var(--sp-4)" }}>
        <Info className="w-3.5 h-3.5" />
        <span>Heuristik: tanggal + jumlah + arah (in/out) sama. Bukan semua duplikat — perlu cek manual.</span>
      </div>

      <div style={{ display: "flex", gap: "2px", background: "var(--surface)", border: "var(--hair)", borderRadius: "var(--r-sm)", padding: "3px", width: "fit-content", marginBottom: "var(--sp-6)" }}>
        <PeriodPicker basePath="/duplikat" current={period} />
      </div>

      {dupes.length === 0 ? (
        <div style={{ textAlign: "center", padding: "var(--sp-8)", color: "var(--ink-400)" }}>
          <CheckCircle2 className="w-8 h-8 mx-auto mb-4 text-emerald-500" />
          <p>Tidak ada potensi duplikat. 500 entry terbaru sudah dicek.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-6)" }}>
          {dupes.map((group) => (
            <section key={group.key} className="section">
              <div className="t-eyebrow" style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "var(--sp-3)" }}>
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                {formatDate(group.date)} · {formatRupiah(group.amount)}
                <span className="badge badge--outline" style={{ marginLeft: "4px" }}>
                  {group.entries[0].direction} · {group.entries.length} mirip
                </span>
              </div>
              
              <table className="ledger">
                <tbody>
                  {group.entries.map((e) => (
                    <tr key={e._id.toString()}>
                      <td style={{ minWidth: 0 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
                          <div style={{ fontWeight: 600, color: "var(--ink-000)" }}>{e.description}</div>
                          <div className="mono" style={{ fontSize: "var(--text-2xs)", color: "var(--ink-400)" }}>{e.account}</div>
                        </div>
                        {e.counterparty && (
                          <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-500)", marginTop: "2px" }}>{e.counterparty}</div>
                        )}
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "8px" }}>
                          <span className="badge badge--outline">{e.domain}</span>
                          {e.owner && <span className="badge badge--outline">{e.owner}</span>}
                          {e.category && <span className="badge badge--outline">{e.category.replace(/_/g, " ")}</span>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          ))}
        </div>
      )}
    </main>
  );
}
