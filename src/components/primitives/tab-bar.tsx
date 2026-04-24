"use client";

import { cn } from "@/lib/utils";

export type TabBarItem<T extends string> = {
  value: T;
  label: string;
};

export function TabBar<T extends string>({
  tabs,
  value,
  onChange,
  size = "md",
  className,
}: {
  tabs: TabBarItem<T>[];
  value: T;
  onChange: (value: T) => void;
  size?: "sm" | "md";
  className?: string;
}) {
  const pad = size === "sm" ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-sm";
  return (
    <div className={cn("inline-flex w-full max-w-full overflow-hidden", className)}>
      <div className="inline-flex min-w-0 gap-1 overflow-x-auto rounded-lg bg-muted/60 p-1 scrollbar-none">
        {tabs.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => onChange(t.value)}
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 rounded-md font-medium transition-all",
              pad,
              t.value === value
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}
