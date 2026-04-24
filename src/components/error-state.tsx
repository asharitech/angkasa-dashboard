import { AlertOctagon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { toneIcon } from "@/lib/colors";
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
  const t = toneIcon.danger;
  return (
    <Card className={cn("border-destructive/20 bg-destructive/5 shadow-sm", className)}>
      <CardContent className="flex items-start gap-3 py-4">
        <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full", t.bg, t.fg)}>
          <AlertOctagon className="h-4 w-4" />
        </div>
        <div className="space-y-0.5">
          <p className={cn("text-sm font-semibold", t.fg)}>{title}</p>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
