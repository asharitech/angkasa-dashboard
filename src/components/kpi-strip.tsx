import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { IconBadge } from "@/components/primitives/icon-badge";
import { toneText, type Tone } from "@/lib/colors";
import { cn } from "@/lib/utils";
import { formatRupiahCompact } from "@/lib/format";

export type KpiItem = {
  label: string;
  value: string;
  rawAmount?: number;
  icon: LucideIcon;
  tone?: Tone;
  hint?: string;
  href?: string;
  valueTone?: Tone;
  compact?: boolean;
};

export function KpiStrip({
  items,
  cols = 4,
}: {
  items: KpiItem[];
  cols?: 2 | 3 | 4 | 5;
}) {
  const colClass =
    cols === 5
      ? "md:grid-cols-5"
      : cols === 4
        ? "md:grid-cols-4"
        : cols === 3
          ? "md:grid-cols-3"
          : "md:grid-cols-2";
  return (
    <div className={cn("grid grid-cols-2 gap-2 md:gap-3", colClass)}>
      {items.map((it) => (
        <KpiCard key={it.label} item={it} />
      ))}
    </div>
  );
}

function KpiCard({ item }: { item: KpiItem }) {
  const tone = item.tone ?? "primary";
  const body = (
    <Card
      className={cn(
        "h-full shadow-sm transition-colors",
        item.href && "hover:border-primary/30 hover:shadow-md",
      )}
    >
      <CardContent className="p-3 md:p-4">
        <div className="flex items-start justify-between gap-2">
          <span className="text-xs font-medium text-muted-foreground md:text-sm">
            {item.label}
          </span>
          <IconBadge icon={item.icon} tone={tone} size="md" />
        </div>
        <p
          className={cn(
            "mt-1.5 text-lg font-bold tabular-nums md:text-xl",
            item.valueTone && toneText[item.valueTone],
          )}
        >
          {item.compact && item.rawAmount !== undefined
            ? formatRupiahCompact(item.rawAmount)
            : item.value}
        </p>
        {item.hint && (
          <p className="mt-1 truncate text-[11px] text-muted-foreground md:text-xs">
            {item.hint}
          </p>
        )}
      </CardContent>
    </Card>
  );
  return item.href ? (
    <Link href={item.href} className="block">
      {body}
    </Link>
  ) : (
    body
  );
}
