import * as React from "react";
import { cn } from "@/lib/utils";

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  children,
  className,
  icon: Icon,
}: {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  icon?: React.ElementType;
}) {
  return (
    <div className={cn("page-head border-b-2 border-ink-000 pb-6 mb-8 items-center", className)}>
      <div className="space-y-1">
        {eyebrow && (
          <div className="t-eyebrow text-accent-700 font-bold tracking-widest uppercase text-[10px] mb-1">
            {eyebrow}
          </div>
        )}
        <h1 className="page-head__title text-3xl md:text-4xl font-bold tracking-tight text-ink-000">
          {Icon && <Icon className="inline-block w-8 h-8 mr-3 align-text-bottom text-accent-700" />}
          {title}
        </h1>
        {subtitle && <div className="page-head__sub text-ink-500 font-medium">{subtitle}</div>}
      </div>
      {children && <div className="page-head__actions flex items-center gap-3">{children}</div>}
    </div>
  );
}
