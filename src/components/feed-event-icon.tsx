import { ArrowDownLeft, ArrowUpRight, Receipt, CreditCard, Repeat } from "lucide-react";
import { cn } from "@/lib/utils";

export function FeedEventIcon({
  event,
}: {
  event: { type: string; direction?: string; domain?: string };
}) {
  if (event.type === "entry") {
    return event.direction === "in" ? (
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
        <ArrowDownLeft className="h-4 w-4" />
      </span>
    ) : (
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-50 text-rose-600">
        <ArrowUpRight className="h-4 w-4" />
      </span>
    );
  }
  const iconMap: Record<string, { icon: typeof Receipt; bg: string; color: string }> = {
    pengajuan: { icon: Receipt, bg: "bg-amber-50", color: "text-amber-600" },
    loan: { icon: CreditCard, bg: "bg-violet-50", color: "text-violet-600" },
    recurring: { icon: Repeat, bg: "bg-blue-50", color: "text-blue-600" },
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
