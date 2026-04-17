import { AlertOctagon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function ErrorState({
  title = "Gagal memuat data",
  description,
  className,
}: {
  title?: string;
  description?: string;
  className?: string;
}) {
  return (
    <Card className={cn("border-rose-200 bg-rose-50/50 shadow-sm", className)}>
      <CardContent className="flex items-start gap-3 py-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600">
          <AlertOctagon className="h-4 w-4" />
        </div>
        <div className="space-y-0.5">
          <p className="text-sm font-semibold text-rose-700">{title}</p>
          {description && (
            <p className="text-xs text-rose-600/80">{description}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
