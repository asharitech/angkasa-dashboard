import { getDataIntegrityIssues } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { ShieldCheck, AlertTriangle, Info, ShieldAlert } from "lucide-react";

export const dynamic = "force-dynamic";

const SEVERITY_STYLE: Record<string, { bg: string; fg: string; icon: typeof Info }> = {
  info:  { bg: "bg-sky-50",     fg: "text-sky-700",     icon: Info },
  warn:  { bg: "bg-amber-50",   fg: "text-amber-700",   icon: AlertTriangle },
  error: { bg: "bg-rose-50",    fg: "text-rose-700",    icon: ShieldAlert },
};

export default async function AuditPage() {
  const issues = await getDataIntegrityIssues();
  const counts = issues.reduce<Record<string, number>>((acc, i) => {
    acc[i.severity] = (acc[i.severity] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <PageHeader icon={ShieldCheck} title="Audit Data">
        <Badge
          className={
            issues.length === 0
              ? "bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold px-3 py-1.5"
              : "bg-amber-50 text-amber-700 border-amber-200 font-semibold px-3 py-1.5"
          }
        >
          {issues.length} isu
        </Badge>
      </PageHeader>

      <div className="grid grid-cols-3 gap-3">
        {["error", "warn", "info"].map((sev) => {
          const s = SEVERITY_STYLE[sev];
          const Icon = s.icon;
          return (
            <Card key={sev} className={`shadow-sm ${s.bg}`}>
              <CardContent className="py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className={`h-4 w-4 ${s.fg}`} />
                  <span className={`text-xs font-semibold ${s.fg} uppercase`}>{sev}</span>
                </div>
                <span className={`text-xl font-bold tabular-nums ${s.fg}`}>{counts[sev] ?? 0}</span>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {issues.length === 0 ? (
        <Card className="shadow-sm border-emerald-100 bg-emerald-50/30">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <ShieldCheck className="h-10 w-10 text-emerald-500 mb-3" />
            <p className="text-sm font-semibold text-emerald-700">Data bersih</p>
            <p className="text-xs text-muted-foreground mt-1">Tidak ada isu integritas saat ini.</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Daftar Isu</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {issues.map((issue, idx) => {
              const s = SEVERITY_STYLE[issue.severity];
              const Icon = s.icon;
              return (
                <div key={`${issue.kind}-${idx}`} className={`rounded-lg ${s.bg} px-4 py-3`}>
                  <div className="flex items-start gap-3">
                    <Icon className={`h-4 w-4 mt-0.5 ${s.fg}`} />
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm font-semibold ${s.fg}`}>{issue.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        <code className="font-mono">{issue.kind}</code>
                        {issue.entity_id && (
                          <>{" · "}<code className="font-mono">{issue.entity_id}</code></>
                        )}
                      </p>
                      {issue.hint && (
                        <p className="text-xs text-muted-foreground mt-1 italic">{issue.hint}</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
