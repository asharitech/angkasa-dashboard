/**
 * Canonical chrome for dashboard cards and bordered panels.
 * Keeps SectionCard (ui/card), DashboardSurface, and one-off shells visually aligned.
 */
export const DASHBOARD_CARD_SHELL =
  "rounded-xl border border-border bg-card text-card-foreground shadow-sm" as const;

/** List rows / tiles that sit next to stronger panels */
export const DASHBOARD_CARD_SHELL_SOFT =
  "rounded-xl border border-border/60 bg-card text-card-foreground shadow-sm" as const;
