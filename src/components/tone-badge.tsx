import * as React from "react";
import { cn } from "@/lib/utils";

export type Tone = "pos" | "warn" | "neg" | "info" | "outline";

export function ToneBadge({
  tone = "outline",
  children,
  className,
}: {
  tone?: Tone;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span className={cn(`badge badge--${tone}`, className)}>
      {tone !== "outline" && <span className="badge__dot"></span>}
      {children}
    </span>
  );
}
