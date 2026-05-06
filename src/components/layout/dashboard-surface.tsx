import type { ReactNode } from "react";
import Link from "next/link";
import {
  DASHBOARD_CARD_SHELL,
  DASHBOARD_CARD_SHELL_SOFT,
  DASHBOARD_DROPZONE_SHELL,
  DASHBOARD_INSET_PANEL,
  DASHBOARD_PLACEHOLDER_SHELL,
  DASHBOARD_SEARCH_INPUT_CLASS,
} from "@/lib/dashboard-card-shell";
import { cn } from "@/lib/utils";

export {
  DASHBOARD_CARD_SHELL,
  DASHBOARD_CARD_SHELL_SOFT,
  DASHBOARD_DROPZONE_SHELL,
  DASHBOARD_INSET_PANEL,
  DASHBOARD_PLACEHOLDER_SHELL,
  DASHBOARD_SEARCH_INPUT_CLASS,
};

/** Standard bordered panel for dashboard metrics and dense blocks. */
export function DashboardSurface({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn(DASHBOARD_CARD_SHELL, "p-5", className)}>
      {children}
    </div>
  );
}

/**
 * Compact dashboard nav tile (Beranda “Akses cepat”, similar grids).
 */
/** Muted inset panel (rincian inside accordion, form sub-groups). Default padding p-3. */
export function DashboardInset({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn(DASHBOARD_INSET_PANEL, "p-3", className)}>
      {children}
    </div>
  );
}

export function DashboardQuickLink({
  href,
  title,
  subtitle,
  icon,
  iconFrameClassName,
  badge,
  contentClassName,
  className,
}: {
  href: string;
  title: string;
  subtitle?: string;
  icon: ReactNode;
  /** Classes for the square behind the icon (tone / bg). */
  iconFrameClassName?: string;
  badge?: ReactNode;
  contentClassName?: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "relative flex items-center gap-2.5 rounded-xl border border-border/60 bg-background px-3 py-3 text-left transition-colors hover:border-primary/40 hover:bg-accent/50",
        className,
      )}
    >
      {badge}
      <div
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
          iconFrameClassName,
        )}
      >
        {icon}
      </div>
      <div className={cn("min-w-0", contentClassName)}>
        <p className="text-xs font-semibold leading-tight">{title}</p>
        {subtitle ? (
          <p className="text-[10px] text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>
    </Link>
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
        "group flex items-start gap-3 p-4 transition-all hover:border-border hover:shadow-md",
        DASHBOARD_CARD_SHELL_SOFT,
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
        "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
        DASHBOARD_CARD_SHELL_SOFT,
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
