import Link from "next/link";
import {
  Clock,
  Truck,
  CheckCircle2,
  ChevronRight,
  ListChecks,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { SectionCard } from "@/components/section-card";
import { IconBadge } from "@/components/primitives/icon-badge";
import { Badge } from "@/components/ui/badge";
import { formatRupiahCompact } from "@/lib/format";
import type { Tone } from "@/lib/colors";

type TaskRow = {
  icon: LucideIcon;
  tone: Tone;
  title: string;
  detail: string;
  href: string;
};

export function TaskListPanel({
  pengajuanPending,
  pengajuanTotalAmount,
  pendingTransfersCount,
  pendingTransfersTotal,
}: {
  pengajuanPending: number;
  pengajuanTotalAmount: number;
  pendingTransfersCount: number;
  pendingTransfersTotal: number;
}) {
  const tasks: TaskRow[] = [];

  if (pengajuanPending > 0) {
    tasks.push({
      icon: Clock,
      tone: "danger",
      title: `${pengajuanPending} pengajuan belum lunas`,
      detail: formatRupiahCompact(pengajuanTotalAmount),
      href: "/pengajuan",
    });
  }

  if (pendingTransfersCount > 0) {
    tasks.push({
      icon: Truck,
      tone: "warning",
      title: `${pendingTransfersCount} transfer sewa menunggu`,
      detail: formatRupiahCompact(pendingTransfersTotal),
      href: "/sewa",
    });
  }

  return (
    <SectionCard
      icon={ListChecks}
      title="Perlu ditindak"
      tone="warning"
      badge={
        tasks.length > 0 ? (
          <Badge variant="warning" className="ml-1 tabular-nums">
            {tasks.length}
          </Badge>
        ) : undefined
      }
      bodyClassName="p-0"
    >
      {tasks.length === 0 ? (
        <div className="flex items-center gap-3 px-4 py-4">
          <IconBadge icon={CheckCircle2} tone="success" size="sm" />
          <span className="text-sm font-medium text-muted-foreground">Semua beres</span>
        </div>
      ) : (
        <div>
          {tasks.map((task, i) => (
            <Link
              key={i}
              href={task.href}
              className="flex items-center gap-3 px-4 py-3 hover:bg-accent/50 transition-colors border-t border-border/60 first:border-t-0"
            >
              <IconBadge icon={task.icon} tone={task.tone} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{task.title}</p>
                <p className="truncate text-xs text-muted-foreground">{task.detail}</p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            </Link>
          ))}
        </div>
      )}
    </SectionCard>
  );
}
