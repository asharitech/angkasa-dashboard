import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { toneIcon, type Tone } from "@/lib/colors";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon: Icon,
  title,
  description,
  tone = "muted",
  action,
  className,
  /** Inside tables/cards: no border, no outer shadow, tighter padding */
  embedded,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  tone?: Tone;
  action?: React.ReactNode | { label: string; href: string };
  className?: string;
  embedded?: boolean;
}) {
  const t = toneIcon[tone];
  // Determine if action is a legacy {label, href} object or a ReactNode
  const isLegacyAction = action && typeof action === "object" && !!(action as { label?: string }).label && !!(action as { href?: string }).href;
  return (
    <Card
      className={cn(
        "shadow-sm",
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
        <div className={cn("flex h-12 w-12 items-center justify-center rounded-full", t.bg)}>
          <Icon className={cn("h-6 w-6", t.fg)} />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-semibold">{title}</p>
          {description && (
            <p className="max-w-sm text-xs text-muted-foreground">{description}</p>
          )}
        </div>
        {action && (
          isLegacyAction ? (
            // Legacy: render as a link
            <LegacyActionLink action={action as { label: string; href: string }} />
          ) : (
            // ReactNode: render directly
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
