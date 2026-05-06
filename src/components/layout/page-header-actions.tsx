import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Standard container for `PageHeader` action content.
 * Keeps badge/button spacing consistent across dashboard pages.
 */
export function PageHeaderActions({
  children,
  className,
  wrap = true,
}: {
  children: ReactNode;
  className?: string;
  wrap?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-2",
        wrap && "flex-wrap",
        className,
      )}
    >
      {children}
    </div>
  );
}
