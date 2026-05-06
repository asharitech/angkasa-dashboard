import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

export function PageHeader({
  icon: Icon,
  title,
  titleSuffix,
  description,
  children,
}: {
  icon: LucideIcon;
  title: string;
  /** Inline after the title (e.g. account badge); does not truncate with the title. */
  titleSuffix?: ReactNode;
  /** Short supporting copy under the title (muted). */
  description?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <header className="space-y-1.5">
      <div className="flex min-w-0 items-center justify-between gap-3">
        <h1 className="flex min-w-0 items-center gap-2 text-xl font-bold tracking-tight md:text-2xl">
          <Icon className="h-6 w-6 shrink-0 text-primary" aria-hidden />
          <span className="min-w-0 truncate">{title}</span>
          {titleSuffix ? (
            <span className="flex shrink-0 items-center">{titleSuffix}</span>
          ) : null}
        </h1>
        {children ? <div className="shrink-0">{children}</div> : null}
      </div>
      {description ? (
        <p className="text-sm text-muted-foreground md:pl-8 [&_strong]:font-medium [&_strong]:text-foreground">
          {description}
        </p>
      ) : null}
    </header>
  );
}
