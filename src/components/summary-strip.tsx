import * as React from "react";
import { cn } from "@/lib/utils";
import type { Tone } from "./tone-badge";

export function SummaryStrip({
  children,
  className,
  style,
  variant = "standard",
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  variant?: "standard" | "sewa"; // 'standard' uses .summary-strip, 'sewa' uses .sewa-summary
}) {
  return (
    <div
      className={cn(
        variant === "sewa" ? "sewa-summary" : "summary-strip",
        className
      )}
      style={style}
    >
      {children}
    </div>
  );
}

export function SummaryCell({
  label,
  value,
  valueClassName,
  subtext,
  progress,
  progressTone = "pos",
  variant = "standard",
  icon,
  tone,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
  valueClassName?: string;
  subtext?: React.ReactNode;
  progress?: number;
  progressTone?: Tone;
  variant?: "standard" | "sewa";
  icon?: React.ReactNode;
  tone?: Tone;
}) {
  const isSewa = variant === "sewa";
  const cellClass = isSewa ? "ss-cell" : "summary-cell";
  const labelClass = isSewa ? "ss-cell__label" : "summary-cell__label";
  const valueClass = isSewa ? "ss-cell__value" : "summary-cell__value";
  const subClass = isSewa ? "ss-cell__sub" : "summary-cell__meta";

  let derivedValueClass = valueClassName;
  if (tone === "warn") derivedValueClass = cn(derivedValueClass, "text-warn-700");
  if (tone === "pos") derivedValueClass = cn(derivedValueClass, "text-pos-700");
  if (tone === "neg") derivedValueClass = cn(derivedValueClass, "text-neg-700");
  if (tone === "info") derivedValueClass = cn(derivedValueClass, "text-info-700");

  return (
    <div className={cellClass}>
      <div className={cn(labelClass, "flex items-center gap-1.5")}>
        {icon && <span className="opacity-70 [&>svg]:w-3.5 [&>svg]:h-3.5">{icon}</span>}
        {label}
      </div>
      <div className={cn(valueClass, derivedValueClass)}>{value}</div>
      {subtext && <div className={subClass}>{subtext}</div>}
      
      {progress !== undefined && (
        <div className={isSewa ? "ss-cell__progress" : "mt-2"}>
          <div className="bar">
            <div
              className={cn("bar__fill", `bar__fill--${progressTone}`)}
              style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
            ></div>
          </div>
        </div>
      )}
    </div>
  );
}
