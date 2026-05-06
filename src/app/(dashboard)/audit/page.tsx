import { getDataIntegrityIssues } from "@/lib/dal";
import { PageHeader } from "@/components/page-header";
import { KpiStrip, type KpiItem } from "@/components/kpi-strip";
import { SectionCard } from "@/components/section-card";
import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { severityTone, toneIcon, type Tone } from "@/lib/colors";
import { cn } from "@/lib/utils";
import {
  ShieldCheck,
  AlertTriangle,
  Info,
  ShieldAlert,
} from "lucide-react";
import { DashboardPageShell } from "@/components/layout/dashboard-page-shell";

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
    <DashboardPageShell>
      <PageHeader icon={ShieldCheck} title="Audit Data">
        <Badge
          variant={issues.length === 0 ? "success" : "warning"}
          className="font-semibold"
        >
          {issues.length} isu
        </Badge>
      </PageHeader>

      <KpiStrip items={kpis} cols={3} />

      {issues.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          tone="success"
          title="Data bersih"
          description="Tidak ada isu integritas saat ini."
        />
      ) : (
        <div className="space-y-4">
          {severities.map((sev) => {
            const list = grouped.get(sev) ?? [];
            if (list.length === 0) return null;
            const tone: Tone = severityTone(sev);
            const Icon = SEVERITY_ICON[sev];
            return (
              <SectionCard
                key={sev}
                icon={Icon}
                title={SEVERITY_LABEL[sev]}
                tone={tone}
                badge={
                  <span className="ml-1 text-xs text-muted-foreground tabular-nums">
                    {list.length}
                  </span>
                }
              >
                <ul className="divide-y divide-border/60">
                  {list.map((issue, idx) => {
                    const t = toneIcon[tone];
                    return (
                      <li
                        key={`${issue.kind}-${idx}`}
                        className="flex items-start gap-3 py-2.5"
                      >
                        <span
                          className={cn(
                            "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
                            t.bg,
                          )}
                        >
                          <Icon className={cn("h-3 w-3", t.fg)} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold">{issue.message}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            <code className="font-mono">{issue.kind}</code>
                            {issue.entity_id && (
                              <>
                                {" · "}
                                <code className="font-mono">{issue.entity_id}</code>
                              </>
                            )}
                          </p>
                          {issue.hint && (
                            <p className="mt-0.5 text-xs italic text-muted-foreground">
                              {issue.hint}
                            </p>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </SectionCard>
            );
          })}
        </div>
      )}
    </DashboardPageShell>
  );
}
