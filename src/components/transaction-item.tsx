import { TrendingUp, TrendingDown } from "lucide-react";

export function TransactionIcon({ direction }: { direction: string }) {
  const isOut = direction === "out";
  return (
    <div
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
        isOut ? "bg-destructive/15 text-destructive" : "bg-success/15 text-success"
      }`}
    >
      {isOut ? (
        <TrendingDown className="h-5 w-5" />
      ) : (
        <TrendingUp className="h-5 w-5" />
      )}
    </div>
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
