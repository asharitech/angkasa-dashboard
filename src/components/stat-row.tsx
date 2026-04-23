import { formatRupiah } from "@/lib/format";
import { cn } from "@/lib/utils";

export function StatRow({
  label,
  value,
  labelClassName,
  valueClassName,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
  labelClassName?: string;
  valueClassName?: string;
}) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <span className={cn("text-sm text-muted-foreground", labelClassName)}>{label}</span>
      <span className={cn("text-sm font-semibold tabular-nums", valueClassName)}>{value}</span>
    </div>
  );
}

/** Key row with optional highlight (e.g. subtotal in projections). */
export function StatRowRupiah({
  label,
  amount,
  highlight,
  variant = "default",
}: {
  label: React.ReactNode;
  amount: number;
  highlight?: boolean;
  variant?: "default" | "total";
}) {
  const isTotal = variant === "total";
  return (
    <div className="flex items-center justify-between py-2.5">
      <span
        className={cn(
          "text-sm",
          isTotal ? "font-semibold" : highlight ? "font-semibold" : "text-muted-foreground",
        )}
      >
        {label}
      </span>
      <span
        className={cn(
          "tabular-nums",
          isTotal
            ? "text-base font-bold"
            : highlight
              ? "text-base font-bold text-primary"
              : "text-sm font-semibold",
        )}
      >
        {formatRupiah(amount)}
      </span>
    </div>
  );
}
