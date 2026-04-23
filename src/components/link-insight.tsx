import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function NavChevronLink({ href }: { href: string }) {
  return (
    <Link
      href={href}
      className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
    >
      <ChevronRight className="h-4 w-4" />
    </Link>
  );
}

export function InsightLinkCard({
  href,
  tone,
  icon: Icon,
  title,
  hint,
}: {
  href: string;
  tone: "danger" | "warning";
  icon: LucideIcon;
  title: string;
  hint: string;
}) {
  const cls =
    tone === "danger"
      ? "border-rose-200 bg-rose-50/50 hover:bg-rose-50"
      : "border-amber-200 bg-amber-50/50 hover:bg-amber-50";
  const fg = tone === "danger" ? "text-rose-700" : "text-amber-700";
  return (
    <Link href={href} className="block">
      <Card className={cn("shadow-sm transition-colors", cls)}>
        <CardContent className="flex items-center gap-3 py-2.5">
          <Icon className={cn("h-4 w-4 shrink-0", fg)} />
          <div className="min-w-0 flex-1">
            <p className={cn("truncate text-sm font-semibold", fg)}>{title}</p>
            <p className="truncate text-xs text-muted-foreground">{hint}</p>
          </div>
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
        </CardContent>
      </Card>
    </Link>
  );
}
