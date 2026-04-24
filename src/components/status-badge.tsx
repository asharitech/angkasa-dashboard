import { Badge } from "@/components/ui/badge";
import { obligationStatusTone, toneVariant } from "@/lib/colors";
import { formatStatusLabel } from "@/lib/names";

export function StatusBadge({
  status,
  size = "default"
}: {
  status: string;
  size?: "default" | "sm";
}) {
  const sizeClasses = size === "sm" ? "px-1.5 py-0.5 text-xs" : "px-2 py-1";

  return (
    <Badge variant={toneVariant(obligationStatusTone(status))} className={`font-medium ${sizeClasses}`}>
      {formatStatusLabel(status)}
    </Badge>
  );
}
