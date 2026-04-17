import Link from "next/link";
import type { LucideIcon } from "lucide-react";
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
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  tone?: Tone;
  action?: { label: string; href: string };
  className?: string;
}) {
  const t = toneIcon[tone];
  return (
    <Card className={cn("shadow-sm", className)}>
      <CardContent className="flex flex-col items-center justify-center gap-3 py-10 text-center">
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
          <Link
            href={action.href}
            className="mt-1 rounded-full border border-border px-3 py-1 text-xs font-medium hover:bg-accent"
          >
            {action.label}
          </Link>
        )}
      </CardContent>
    </Card>
  );
}
