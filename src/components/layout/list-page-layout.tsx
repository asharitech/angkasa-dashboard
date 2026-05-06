import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { DashboardPageShell, type DashboardPageStackGap } from "@/components/layout/dashboard-page-shell";
import { PageHeader } from "@/components/page-header";
import { KpiStrip, type KpiItem } from "@/components/kpi-strip";

/**
 * Composes the common list-page stack: shell, title row, optional KPI strip, optional toolbar, then body.
 * Use for Pengajuan / Wajib / Aktivitas-style screens to avoid repeating the same structure.
 */
export function ListPageLayout({
  title,
  icon,
  description,
  headerActions,
  kpi,
  kpiCols = 4,
  toolbar,
  gap = "default",
  maxWidth = "none",
  className,
  children,
}: {
  title: string;
  icon: LucideIcon;
  description?: ReactNode;
  headerActions?: ReactNode;
  kpi?: KpiItem[];
  kpiCols?: 2 | 3 | 4 | 5;
  toolbar?: ReactNode;
  gap?: DashboardPageStackGap;
  maxWidth?: "none" | "narrow";
  className?: string;
  children: ReactNode;
}) {
  return (
    <DashboardPageShell gap={gap} maxWidth={maxWidth} className={className}>
      <PageHeader icon={icon} title={title} description={description}>
        {headerActions}
      </PageHeader>
      {kpi != null && kpi.length > 0 ? <KpiStrip items={kpi} cols={kpiCols} /> : null}
      {toolbar}
      {children}
    </DashboardPageShell>
  );
}
