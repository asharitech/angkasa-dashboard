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

/**
 * EmptyState `variant="dashed"`: list pages where the shell should read as “slot kosong”.
 * Merges with Card chrome (rounded-xl border from parent).
 */
export const DASHBOARD_EMPTY_LIST_CARD_CLASS =
  "border-dashed border-border/60 bg-transparent shadow-none" as const;

/** Native / inline inputs and outline buttons in forms (Anggaran, Cicilan). */
export const DASHBOARD_CONTROL_OUTLINE = "rounded-lg border border-border" as const;

/** Expandable region under a card header (detail list). */
export const DASHBOARD_CARD_EXPAND_FOOTER =
  "border-t border-border/50 bg-muted/30 px-4 py-3" as const;

/** Shared bottom rule for stacked headers (notifikasi hero, dialogs). Pair with bg-muted/*. */
export const DASHBOARD_STACK_HEADER_BORDER = "border-b border-border/60" as const;

/** Small uppercase label chip in hero/toolbars. */
export const DASHBOARD_META_PILL =
  "inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/80 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground" as const;
