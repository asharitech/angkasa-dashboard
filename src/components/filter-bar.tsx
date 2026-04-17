import Link from "next/link";
import { cn } from "@/lib/utils";

export type FilterTab = {
  label: string;
  href: string;
  active: boolean;
  count?: number;
};

export function FilterTabs({ tabs, className }: { tabs: FilterTab[]; className?: string }) {
  return (
    <div
      className={cn(
        "flex gap-1.5 overflow-x-auto pb-1 scrollbar-none",
        className,
      )}
    >
      {tabs.map((t) => (
        <Link
          key={t.href + t.label}
          href={t.href}
          className={cn(
            "shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
            t.active
              ? "bg-foreground text-background border-foreground"
              : "bg-background text-muted-foreground border-border hover:text-foreground",
          )}
        >
          <span>{t.label}</span>
          {typeof t.count === "number" && (
            <span
              className={cn(
                "ml-1.5 rounded-full px-1.5 py-px text-[10px] tabular-nums",
                t.active ? "bg-background/20" : "bg-muted",
              )}
            >
              {t.count}
            </span>
          )}
        </Link>
      ))}
    </div>
  );
}

export function FilterBar({ children }: { children: React.ReactNode }) {
  return <div className="space-y-2">{children}</div>;
}
