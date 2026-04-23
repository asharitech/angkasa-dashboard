import { cn } from "@/lib/utils";

/** Uppercase muted label for subsections inside lists (e.g. category headers). */
export function ListSectionTitle({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70",
        className,
      )}
    >
      {children}
    </p>
  );
}
