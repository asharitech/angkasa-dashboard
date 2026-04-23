import { ArrowDownLeft, ArrowUpRight, Receipt, CreditCard, Repeat } from "lucide-react";
import { cn } from "@/lib/utils";

export function FeedEventIcon({
  event,
}: {
  event: { type: string; direction?: string; domain?: string };
}) {
  if (event.type === "entry") {
    return event.direction === "in" ? (
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-success/15 text-success">
        <ArrowDownLeft className="h-4 w-4" />
      </span>
    ) : (
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-destructive/15 text-destructive">
        <ArrowUpRight className="h-4 w-4" />
      </span>
    );
  }
  const iconMap: Record<string, { icon: typeof Receipt; bg: string; color: string }> = {
    pengajuan: { icon: Receipt, bg: "bg-warning/15", color: "text-warning" },
    loan: { icon: CreditCard, bg: "bg-primary/10", color: "text-primary" },
    recurring: { icon: Repeat, bg: "bg-info/15", color: "text-info" },
  };
  const cfg = iconMap[event.domain ?? ""] ?? iconMap.pengajuan;
  const Icon = cfg.icon;
  return (
    <span
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-full",
        cfg.bg,
        cfg.color,
      )}
    >
      <Icon className="h-4 w-4" />
    </span>
  );
}
