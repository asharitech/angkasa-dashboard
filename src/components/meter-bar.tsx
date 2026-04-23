import { cn } from "@/lib/utils";

export function MeterBar({
  percent,
  fillClassName,
  trackClassName = "bg-muted",
  heightClassName = "h-2",
}: {
  percent: number;
  fillClassName: string;
  trackClassName?: string;
  heightClassName?: string;
}) {
  const w = Math.min(Math.max(percent, 0), 100);
  return (
    <div
      className={cn(
        "w-full overflow-hidden rounded-full",
        heightClassName,
        trackClassName,
      )}
    >
      <div
        className={cn(
          "h-full rounded-full transition-all duration-500 ease-out",
          fillClassName,
        )}
        style={{ width: `${w}%` }}
      />
    </div>
  );
}

export function MeterBarLabeled({
  percent,
  fillClassName,
  labelLeft,
  labelRight,
  footerClassName,
}: {
  percent: number;
  fillClassName: string;
  labelLeft: React.ReactNode;
  labelRight: React.ReactNode;
  footerClassName?: string;
}) {
  return (
    <div className="space-y-1.5">
      <div
        className={cn(
          "flex items-center justify-between text-xs",
          footerClassName ?? "text-muted-foreground",
        )}
      >
        <span>{labelLeft}</span>
        <span>{labelRight}</span>
      </div>
      <MeterBar percent={percent} fillClassName={fillClassName} />
    </div>
  );
}

/** Fill color classes for agenda-style completion ratio (0–100). */
export function agendaMeterFillClass(percent: number): string {
  if (percent === 100) return "bg-emerald-500";
  if (percent >= 60) return "bg-blue-500";
  if (percent >= 30) return "bg-amber-400";
  return "bg-rose-500";
}
