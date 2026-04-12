import { Badge } from "@/components/ui/badge";
import { statusStyles } from "@/lib/constants";

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge className={`font-medium border ${statusStyles[status] ?? ""}`}>
      {status}
    </Badge>
  );
}
