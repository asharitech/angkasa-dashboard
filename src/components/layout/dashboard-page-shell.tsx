import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Canonical vertical rhythm between major blocks on dashboard pages. */
const GAP_CLASS = {
  compact: "space-y-4",
  default: "space-y-5",
  relaxed: "space-y-6",
} as const;

export type DashboardPageStackGap = keyof typeof GAP_CLASS;

/**
 * Wraps dashboard page content with consistent stacking gap and optional width.
 * Use on server `page.tsx` files and client feature shells instead of ad-hoc `space-y-*` roots.
 * Avoid extra vertical padding here — `Shell` already sets main content `pt` / `pb`.
 */
export function DashboardPageShell({
  children,
  gap = "default",
  maxWidth = "none",
  className,
}: {
  children: ReactNode;
  gap?: DashboardPageStackGap;
  /** `narrow` = readable column for forms / personal tools (matches max-w-3xl). */
  maxWidth?: "none" | "narrow";
  className?: string;
}) {
  return (
    <div
      className={cn(
        GAP_CLASS[gap],
        maxWidth === "narrow" && "mx-auto w-full max-w-3xl",
        className
      )}
    >
      {children}
    </div>
  );
}
