import type { LucideIcon } from "lucide-react";
import { toneIcon, type Tone } from "@/lib/colors";
import { cn } from "@/lib/utils";

const SIZE = {
  xs: { box: "h-6 w-6",   icon: "h-3 w-3",     radius: "rounded" },
  sm: { box: "h-7 w-7",   icon: "h-3.5 w-3.5",  radius: "rounded-md" },
  md: { box: "h-8 w-8",   icon: "h-4 w-4",      radius: "rounded-lg" },
  lg: { box: "h-10 w-10", icon: "h-5 w-5",      radius: "rounded-full" },
  xl: { box: "h-12 w-12", icon: "h-6 w-6",      radius: "rounded-full" },
} as const;

export type IconBadgeSize = keyof typeof SIZE;

export function IconBadge({
  icon: Icon,
  tone = "muted",
  size = "md",
  shape,
  className,
}: {
  icon: LucideIcon;
  tone?: Tone;
  size?: IconBadgeSize;
  /** Overrides the default shape for this size. */
  shape?: "square" | "rounded" | "circle";
  className?: string;
}) {
  const s = SIZE[size];
  const t = toneIcon[tone];
  const radius =
    shape === "square"
      ? "rounded"
      : shape === "circle"
        ? "rounded-full"
        : shape === "rounded"
          ? "rounded-md"
          : s.radius;

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center",
        s.box,
        radius,
        t.bg,
        t.fg,
        className,
      )}
      aria-hidden="true"
    >
      <Icon className={s.icon} />
    </div>
  );
}
