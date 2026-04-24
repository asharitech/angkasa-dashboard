import { cn } from "@/lib/utils";

/**
 * Section divider with label + optional count badge and a full-width rule.
 * Use for date groups, status groups, and category sections in list views.
 */
export function SectionGroupHeader({
  label,
  count,
  className,
}: {
  label: string;
  count?: number;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-2 pb-0.5", className)}>
      <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      {count !== undefined && (
        <span className="rounded-full bg-muted px-1.5 py-px text-[10px] font-semibold tabular-nums text-muted-foreground">
          {count}
        </span>
      )}
      <div className="h-px flex-1 bg-border/60" />
    </div>
  );
}
