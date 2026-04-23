import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toneIcon, type Tone } from "@/lib/colors";
import { cn } from "@/lib/utils";

export function SectionCard({
  icon: Icon,
  title,
  tone = "primary",
  badge,
  action,
  bodyClassName,
  className,
  children,
}: {
  icon?: LucideIcon;
  title?: string;
  tone?: Tone;
  badge?: React.ReactNode;
  action?: React.ReactNode;
  bodyClassName?: string;
  className?: string;
  children: React.ReactNode;
}) {
  const t = toneIcon[tone];
  const showHeader = Boolean(title || badge || action);
  return (
    <Card className={cn("shadow-sm", className)}>
      {showHeader && (
        <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0 pb-3">
          <div className="flex min-w-0 items-center gap-2">
            {Icon && (
              <div
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-md",
                  t.bg,
                  t.fg,
                )}
              >
                <Icon className="h-3.5 w-3.5" aria-hidden="true" />
              </div>
            )}
            {title && (
              <CardTitle className="truncate text-sm font-semibold md:text-base">
                {title}
              </CardTitle>
            )}
            {badge}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </CardHeader>
      )}
      <CardContent className={cn(showHeader ? "pt-0" : "p-4", bodyClassName)}>
        {children}
      </CardContent>
    </Card>
  );
}
