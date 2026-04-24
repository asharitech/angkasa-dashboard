import { TrendingUp, TrendingDown } from "lucide-react";
import { IconBadge } from "@/components/primitives/icon-badge";

export function TransactionIcon({ direction }: { direction: string }) {
  return (
    <IconBadge
      icon={direction === "out" ? TrendingDown : TrendingUp}
      tone={direction === "out" ? "danger" : "success"}
      size="lg"
      shape="circle"
    />
  );
}

export function AmountText({
  amount,
  direction,
  formatter,
}: {
  amount: number;
  direction: string;
  formatter: (n: number) => string;
}) {
  const isOut = direction === "out";
  return (
    <span
      className={`text-base font-bold tabular-nums shrink-0 ${
        isOut ? "text-destructive" : "text-success"
      }`}
    >
      {isOut ? "-" : "+"}
      {formatter(amount)}
    </span>
  );
}
