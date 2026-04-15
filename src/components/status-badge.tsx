import { Badge } from "@/components/ui/badge";
import { statusStyles } from "@/lib/constants";

export function StatusBadge({
  status,
  size = "default"
}: {
  status: string;
  size?: "default" | "sm";
}) {
  const sizeClasses = size === "sm" ? "px-1.5 py-0.5 text-xs" : "px-2 py-1";

  return (
    <Badge className={`font-medium border ${sizeClasses} ${statusStyles[status] ?? ""}`}>
      {status}
    </Badge>
  );
}
