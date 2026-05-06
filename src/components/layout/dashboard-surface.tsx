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
