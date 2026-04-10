import { Card, CardContent } from "@/components/ui/card";

export function SummaryCard({
  title,
  value,
  subtitle,
  icon,
  iconColor,
  iconBg,
  valueColor,
}: {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  iconColor: string;
  iconBg: string;
  valueColor?: string;
}) {
  return (
    <Card className="shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <span className="text-xs font-medium text-muted-foreground md:text-sm">
            {title}
          </span>
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-lg ${iconBg} ${iconColor}`}
          >
            {icon}
          </div>
        </div>
        <p
          className={`mt-2 text-xl font-bold tabular-nums md:text-2xl ${valueColor ?? ""}`}
        >
          {value}
        </p>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}

export function MiniSummaryCard({
  title,
  value,
  icon,
  iconColor,
  iconBg,
  valueColor,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  iconColor: string;
  iconBg: string;
  valueColor?: string;
}) {
  return (
    <Card className="shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <span className="text-xs font-medium text-muted-foreground md:text-sm">
            {title}
          </span>
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-lg ${iconBg} ${iconColor}`}
          >
            {icon}
          </div>
        </div>
        <p
          className={`mt-2 text-base font-bold tabular-nums md:text-lg ${valueColor ?? ""}`}
        >
          {value}
        </p>
      </CardContent>
    </Card>
  );
}
