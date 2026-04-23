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
    <div className={cn("page-head", className)}>
      <div>
        {eyebrow && (
          <div className="t-eyebrow" style={{ marginBottom: "var(--sp-2)" }}>
            {eyebrow}
          </div>
        )}
        <h1 className="page-head__title">
          {Icon && <Icon className="inline-block w-5 h-5 mr-2 align-[-3px] text-ink-500" />}
          {title}
        </h1>
        {subtitle && <div className="page-head__sub">{subtitle}</div>}
      </div>
      {children && <div className="page-head__actions">{children}</div>}
    </div>
  );
}
