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

/** Square icon holder for dense list rows (e.g. email-notif source). */
export function DashboardIconFrame({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-card shadow-sm",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Inline destructive alert (form errors, action failures). */
export function DashboardAlertBanner({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn(
        "flex items-start gap-3 rounded-2xl border border-destructive/35 bg-destructive/10 px-4 py-3 text-sm text-destructive",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Hero / summary panel with gradient shell (notifikasi queue, similar marketing-style headers). */
export function DashboardHeroPanel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-2xl border border-border/80 bg-gradient-to-br from-card via-card to-primary/[0.04] shadow-sm",
        className,
      )}
    >
      {children}
    </section>
  );
}

/**
 * Bordered interactive card shell (rounded-2xl). Add `border-l-*` etc. via className.
 */
export function DashboardInteractivePanel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <article
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm transition-shadow hover:shadow-md",
        className,
      )}
    >
      {children}
    </article>
  );
}
