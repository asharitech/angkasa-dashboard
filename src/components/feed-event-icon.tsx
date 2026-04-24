import { ArrowDownLeft, ArrowUpRight, Receipt, CreditCard, Repeat } from "lucide-react";
import { IconBadge } from "@/components/primitives/icon-badge";

export function FeedEventIcon({
  event,
}: {
  event: { type: string; direction?: string; domain?: string };
}) {
  if (event.type === "entry") {
    return event.direction === "in" ? (
      <IconBadge icon={ArrowDownLeft} tone="success" size="md" shape="circle" />
    ) : (
      <IconBadge icon={ArrowUpRight} tone="danger" size="md" shape="circle" />
    );
  }

  const domainMap: Record<string, { icon: typeof Receipt; tone: "warning" | "primary" | "info" }> = {
    pengajuan: { icon: Receipt,    tone: "warning" },
    loan:      { icon: CreditCard, tone: "primary" },
    recurring: { icon: Repeat,     tone: "info" },
  };
  const cfg = domainMap[event.domain ?? ""] ?? domainMap.pengajuan;

  return <IconBadge icon={cfg.icon} tone={cfg.tone} size="md" shape="circle" />;
}
