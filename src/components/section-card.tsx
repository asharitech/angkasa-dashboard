import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IconBadge } from "@/components/primitives/icon-badge";
import type { Tone } from "@/lib/colors";
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
  const showHeader = Boolean(title || badge || action || Icon);
  return (
    <Card className={cn("shadow-sm", className)}>
      {showHeader && (
        <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0 pb-3">
          <div className="flex min-w-0 items-center gap-2">
            {Icon && <IconBadge icon={Icon} tone={tone} size="sm" />}
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
