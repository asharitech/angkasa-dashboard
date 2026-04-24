import { Skeleton } from "@/components/ui/skeleton";

/** Standard loading skeleton for dashboard pages. */
export function SkeletonPage() {
  return (
    <div className="space-y-5">
      {/* PageHeader */}
      <Skeleton className="h-8 w-48" />
      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-3">
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
      </div>
      {/* Main card */}
      <Skeleton className="h-48 rounded-xl" />
      {/* Secondary card */}
      <Skeleton className="h-32 rounded-xl" />
    </div>
  );
}
