import { Skeleton } from "@/components/ui/skeleton";

/** Standard loading skeleton for dashboard pages. */
export function SkeletonPage() {
  return (
    <div className="space-y-5" aria-busy="true" aria-label="Memuat halaman">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 shrink-0 rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-3 w-56" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-3">
        <Skeleton className="h-24 rounded-xl animate-pulse" />
        <Skeleton className="h-24 rounded-xl animate-pulse" />
        <Skeleton className="h-24 rounded-xl animate-pulse" />
        <Skeleton className="h-24 rounded-xl animate-pulse" />
      </div>
      <Skeleton className="h-40 rounded-xl animate-pulse" />
      <Skeleton className="h-28 rounded-xl animate-pulse" />
    </div>
  );
}
