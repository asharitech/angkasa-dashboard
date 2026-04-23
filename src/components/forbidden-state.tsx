import Link from "next/link";
import type { LucideIcon } from "lucide-react";

export function ForbiddenState({
  icon: Icon,
  title = "Akses ditolak",
  description,
  backHref = "/",
  backLabel = "Kembali ke beranda",
}: {
  icon: LucideIcon;
  title?: string;
  description?: string;
  backHref?: string;
  backLabel?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center md:py-20">
      <Icon className="mb-4 h-12 w-12 text-muted-foreground" />
      <p className="text-base font-semibold text-foreground">{title}</p>
      {description ? (
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      ) : null}
      <Link
        href={backHref}
        className="mt-6 text-sm font-medium text-primary hover:underline"
      >
        {backLabel}
      </Link>
    </div>
  );
}
