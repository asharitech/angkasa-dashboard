import Link from "next/link";
import { cn } from "@/lib/utils";

export type FilterTab = {
  label: string;
  href: string;
  active: boolean;
  count?: number;
};

export function FilterTabs({
  tabs,
  className,
  size = "md",
}: {
  tabs: FilterTab[];
  className?: string;
  size?: "sm" | "md";
}) {
  const pad = size === "sm" ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-sm";
  return (
    <div className={cn("inline-flex w-full max-w-full overflow-hidden", className)}>
      <div className="inline-flex min-w-0 gap-1 overflow-x-auto rounded-lg bg-muted/60 p-1 scrollbar-none">
        {tabs.map((t) => (
          <Link
            key={t.href + t.label}
            href={t.href}
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 rounded-md font-medium transition-all",
              pad,
              t.active
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <span>{t.label}</span>
            {typeof t.count === "number" && (
              <span
                className={cn(
                  "rounded-full px-1.5 py-px text-[10px] font-semibold tabular-nums",
                  t.active
                    ? "bg-muted text-muted-foreground"
                    : "bg-background/70 text-muted-foreground",
                )}
              >
                {t.count}
              </span>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}

export function FilterBar({ children }: { children: React.ReactNode }) {
  return <div className="space-y-2">{children}</div>;
}
