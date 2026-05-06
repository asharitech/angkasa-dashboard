import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { IconBadge } from "@/components/primitives/icon-badge";
import { DASHBOARD_EMPTY_LIST_CARD_CLASS } from "@/lib/dashboard-card-shell";
import type { Tone } from "@/lib/colors";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon: Icon,
  title,
  description,
  tone = "muted",
  action,
  className,
  embedded,
  variant = "default",
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  tone?: Tone;
  action?: React.ReactNode | { label: string; href: string };
  className?: string;
  /** Inside tables/cards: no border, no outer shadow, tighter padding */
  embedded?: boolean;
  /** Dashed outline for full-width list empty slots (agenda, dokumen, …). */
  variant?: "default" | "dashed";
}) {
  const isLegacyAction =
    action &&
    typeof action === "object" &&
    !!(action as { label?: string }).label &&
    !!(action as { href?: string }).href;

  return (
    <Card
      className={cn(
        "shadow-sm",
        variant === "dashed" && DASHBOARD_EMPTY_LIST_CARD_CLASS,
        embedded && "border-0 bg-transparent shadow-none",
        className,
      )}
    >
      <CardContent
        className={cn(
          "flex flex-col items-center justify-center gap-3 text-center",
          embedded ? "py-6" : "py-10",
        )}
      >
        <IconBadge icon={Icon} tone={tone} size="xl" shape="circle" />
        <div className="space-y-1">
          <p className="text-sm font-semibold">{title}</p>
          {description && (
            <p className="max-w-sm text-xs text-muted-foreground">{description}</p>
          )}
        </div>
        {action && (
          isLegacyAction ? (
            <LegacyActionLink action={action as { label: string; href: string }} />
          ) : (
            <div className="mt-1">{action as React.ReactNode}</div>
          )
        )}
      </CardContent>
    </Card>
  );
}

function LegacyActionLink({ action }: { action: { label: string; href: string } }) {
  return (
    <Link
      href={action.href}
      className="mt-1 rounded-full border border-border px-3 py-1 text-xs font-medium hover:bg-accent"
    >
      {action.label}
    </Link>
  );
}
