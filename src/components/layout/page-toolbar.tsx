import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Standard container for period navigation (`PeriodPicker`) and `FilterTabs` rows
 * on list-style dashboard pages. Prefer this over ad-hoc `space-y-2` wrappers.
 */
export function PageToolbar({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      role="toolbar"
      aria-label="Filter dan periode"
      className={cn("flex flex-col gap-2", className)}
    >
      {children}
    </div>
  );
}
