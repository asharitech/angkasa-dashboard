import { cn } from "@/lib/utils";

export type KategoriChipConfig = {
  label: string;
  emoji?: string;
  cls: string;
};

/**
 * Filter chips derived from item counts with active/inactive states.
 * Returns null when fewer than 2 distinct keys exist.
 */
export function KategoriChips<T>({
  items,
  getKey,
  configMap,
  activeKey,
  baseHref,
  paramName = "kategori",
}: {
  items: T[];
  getKey: (item: T) => string;
  configMap: Record<string, KategoriChipConfig>;
  activeKey: string | null;
  baseHref: string;
  paramName?: string;
}) {
  const counts = new Map<string, number>();
  for (const item of items) {
    const k = getKey(item);
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  if (counts.size <= 1) return null;

  const fallback: KategoriChipConfig = {
    label: "Lainnya",
    cls: "bg-muted text-muted-foreground border-border/50",
  };

  return (
    <div className="flex flex-wrap gap-1.5">
      {[...counts.entries()].map(([key, count]) => {
        const cfg = configMap[key] ?? fallback;
        const isActive = activeKey === key;
        const href = isActive
          ? baseHref
          : `${baseHref}&${paramName}=${key}`;
        return (
          <a
            key={key}
            href={href}
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-all",
              isActive
                ? cn(cfg.cls, "shadow-sm scale-[1.02]")
                : "border-border/50 bg-muted/30 text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {cfg.emoji && <span>{cfg.emoji}</span>}
            <span>{cfg.label}</span>
            <span className="ml-0.5 rounded-full bg-background/60 px-1 tabular-nums">
              {count}
            </span>
          </a>
        );
      })}
    </div>
  );
}
