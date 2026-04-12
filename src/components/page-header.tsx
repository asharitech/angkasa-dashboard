import type { LucideIcon } from "lucide-react";

export function PageHeader({
  icon: Icon,
  title,
  children,
}: {
  icon: LucideIcon;
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className="text-lg font-semibold tracking-tight md:text-2xl flex items-center gap-2 min-w-0">
        <Icon className="h-5 w-5 md:h-6 md:w-6 text-primary shrink-0" />
        <span className="truncate">{title}</span>
      </h2>
      {children && <div className="shrink-0">{children}</div>}
    </div>
  );
}
