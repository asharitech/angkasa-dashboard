/**
 * Canonical chrome for dashboard cards and bordered panels.
 * Keeps SectionCard (ui/card), DashboardSurface, and one-off shells visually aligned.
 */
export const DASHBOARD_CARD_SHELL =
  "rounded-xl border border-border bg-card text-card-foreground shadow-sm" as const;

/** List rows / tiles that sit next to stronger panels */
export const DASHBOARD_CARD_SHELL_SOFT =
  "rounded-xl border border-border/60 bg-card text-card-foreground shadow-sm" as const;

/** Nested block inside cards / forms (muted field group). */
export const DASHBOARD_INSET_PANEL =
  "rounded-lg border border-border/60 bg-muted/30" as const;

/** Dashed empty region (table placeholder, wide drop hints). */
export const DASHBOARD_PLACEHOLDER_SHELL =
  "rounded-xl border border-dashed border-border/60 bg-muted/5" as const;

/** Compact dashed dropzone (dialogs, file pickers). */
export const DASHBOARD_DROPZONE_SHELL =
  "rounded-lg border-2 border-dashed border-muted-foreground/25" as const;

/** Search field with icon gutter (toolbar / filter row). */
export const DASHBOARD_SEARCH_INPUT_CLASS =
  "h-10 rounded-xl border-border/80 bg-background pl-9 pr-3 shadow-sm" as const;
