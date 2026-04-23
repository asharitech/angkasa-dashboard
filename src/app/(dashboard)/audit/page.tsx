import { getDataIntegrityIssues } from "@/lib/data";
import { PageHeader } from "@/components/page-header";
import { KpiStrip, type KpiItem } from "@/components/kpi-strip";
import { SectionCard } from "@/components/section-card";
import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { severityTone, toneBadge, toneIcon, type Tone } from "@/lib/colors";
import { cn } from "@/lib/utils";
import {
  ShieldCheck,
  AlertTriangle,
  Info,
  ShieldAlert,
} from "lucide-react";

export const dynamic = "force-dynamic";

const SEVERITY_ICON: Record<"error" | "warn" | "info", typeof Info> = {
  error: ShieldAlert,
  warn: AlertTriangle,
  info: Info,
};

const SEVERITY_LABEL: Record<"error" | "warn" | "info", string> = {
  error: "Error",
  warn: "Warning",
  info: "Info",
};

export default async function AuditPage() {
  const issues = await getDataIntegrityIssues();
  const counts = issues.reduce<Record<string, number>>((acc, i) => {
    acc[i.severity] = (acc[i.severity] || 0) + 1;
    return acc;
  }, {});
  const severities: ("error" | "warn" | "info")[] = ["error", "warn", "info"];

  const kpis: KpiItem[] = severities.map((sev) => ({
    label: SEVERITY_LABEL[sev],
    value: String(counts[sev] ?? 0),
    icon: SEVERITY_ICON[sev],
    tone: severityTone(sev),
  }));

  // Group issues by severity for display
  const grouped = new Map<"error" | "warn" | "info", typeof issues>();
  for (const sev of severities) grouped.set(sev, []);
  for (const i of issues) {
    const sev = i.severity as "error" | "warn" | "info";
    grouped.get(sev)?.push(i);
  }

  return (
    <main className="content">
      <div className="page-head">
        <div>
          <h1 className="page-head__title" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <ShieldCheck className="w-6 h-6" />
            Audit Data
          </h1>
        </div>
        <div className="page-head__actions">
          <Badge
            className={cn(
              "font-semibold",
              issues.length === 0 ? toneBadge.success : toneBadge.warning,
            )}
            style={{ borderRadius: "999px", padding: "4px 12px" }}
          >
            {issues.length} isu
          </Badge>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "var(--sp-4)", marginBottom: "var(--sp-6)" }}>
        {kpis.map((kpi, i) => (
          <div className="panel" key={i} style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--sp-4)" }}>
              <span className="t-label">{kpi.label}</span>
              <span className={cn("flex h-6 w-6 items-center justify-center rounded-full", toneIcon[kpi.tone as Tone]?.bg)}>
                <kpi.icon className={cn("h-3 w-3", toneIcon[kpi.tone as Tone]?.fg)} />
              </span>
            </div>
            <div className="mono" style={{ fontSize: "var(--text-3xl)", fontWeight: 600 }}>{kpi.value}</div>
          </div>
        ))}
      </div>

      {issues.length === 0 ? (
        <div style={{ textAlign: "center", padding: "var(--sp-8)", color: "var(--ink-400)" }}>
          <ShieldCheck className="w-8 h-8 mx-auto mb-4 text-emerald-500" />
          <p>Data bersih. Tidak ada isu integritas saat ini.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-6)" }}>
          {severities.map((sev) => {
            const list = grouped.get(sev) ?? [];
            if (list.length === 0) return null;
            const tone: Tone = severityTone(sev);
            const Icon = SEVERITY_ICON[sev];
            const t = toneIcon[tone];
            
            return (
              <section key={sev} className="section">
                <div className="t-eyebrow" style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "var(--sp-3)" }}>
                  <Icon className={cn("h-4 w-4", t.fg)} />
                  {SEVERITY_LABEL[sev]}
                  <span className="mono" style={{ color: "var(--ink-400)", marginLeft: "4px" }}>{list.length}</span>
                </div>
                
                <table className="ledger">
                  <tbody>
                    {list.map((issue, idx) => (
                      <tr key={`${issue.kind}-${idx}`}>
                        <td style={{ width: "32px", paddingRight: 0 }}>
                          <span className={cn("flex h-5 w-5 items-center justify-center rounded-full", t.bg)}>
                            <Icon className={cn("h-3 w-3", t.fg)} />
                          </span>
                        </td>
                        <td style={{ minWidth: 0, paddingLeft: "12px" }}>
                          <div style={{ fontWeight: 600, color: "var(--ink-000)" }}>{issue.message}</div>
                          <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-400)", marginTop: "4px" }}>
                            <code className="mono">{issue.kind}</code>
                            {issue.entity_id && (
                              <>
                                {" · "}
                                <code className="mono">{issue.entity_id}</code>
                              </>
                            )}
                          </div>
                          {issue.hint && (
                            <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-500)", fontStyle: "italic", marginTop: "4px" }}>
                              {issue.hint}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
            );
          })}
        </div>
      )}
    </main>
  );
}
