import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Standard bordered panel for dashboard metrics and dense blocks (matches Laporan Op hero cards). */
export function DashboardSurface({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card p-5 shadow-sm",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Compact numeric tile for 3-up summary grids (e.g. Dokumen stats). */
export function DashboardStatTile({
  value,
  label,
  className,
}: {
  value: ReactNode;
  label: string;
  className?: string;
}) {
  return (
    <DashboardSurface className={cn("p-3 text-center", className)}>
      <p className="text-2xl font-bold tabular-nums">{value}</p>
      <p className="mt-0.5 text-[11px] text-muted-foreground">{label}</p>
    </DashboardSurface>
  );
}

export function DashboardStatTileGrid({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("grid grid-cols-3 gap-2.5", className)}>
      {children}
    </div>
  );
}

/** List row with shared hover/border treatment (document list, similar dense rows). */
export function DashboardInteractiveRow({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "group flex items-start gap-3 rounded-xl border border-border/60 bg-card p-4 shadow-sm transition-all hover:border-border hover:shadow-md",
        className,
      )}
    >
      {children}
    </div>
  );
}
