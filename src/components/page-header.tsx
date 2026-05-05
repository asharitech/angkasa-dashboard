import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

export function PageHeader({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: LucideIcon;
  title: string;
  /** Short supporting copy under the title (muted). */
  description?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex min-w-0 items-center justify-between gap-3">
        <h2 className="flex min-w-0 items-center gap-2 text-lg font-semibold tracking-tight md:text-2xl">
          <Icon className="h-5 w-5 shrink-0 text-primary md:h-6 md:w-6" aria-hidden />
          <span className="truncate">{title}</span>
        </h2>
        {children ? <div className="shrink-0">{children}</div> : null}
      </div>
      {description ? (
        <p className="text-sm text-muted-foreground md:pl-8 [&_strong]:font-medium [&_strong]:text-foreground">
          {description}
        </p>
      ) : null}
    </div>
  );
}
