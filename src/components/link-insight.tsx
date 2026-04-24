import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { toneIcon, type Tone } from "@/lib/colors";
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
  tone = "danger",
  icon: Icon,
  title,
  hint,
}: {
  href: string;
  tone?: Tone;
  icon: LucideIcon;
  title: string;
  hint: string;
}) {
  const t = toneIcon[tone];
  return (
    <Link href={href} className="block">
      <Card className={cn("shadow-sm transition-colors", t.bg, "border-current/20 hover:opacity-90")}>
        <CardContent className="flex items-center gap-3 py-2.5">
          <Icon className={cn("h-4 w-4 shrink-0", t.fg)} />
          <div className="min-w-0 flex-1">
            <p className={cn("truncate text-sm font-semibold", t.fg)}>{title}</p>
            <p className="truncate text-xs text-muted-foreground">{hint}</p>
          </div>
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
        </CardContent>
      </Card>
    </Link>
  );
}
