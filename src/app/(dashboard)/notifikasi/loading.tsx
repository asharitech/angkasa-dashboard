import { Skeleton } from "@/components/ui/skeleton";

export default function NotifikasiLoading() {
  return (
    <div className="space-y-6 py-2 md:py-0" aria-busy="true" aria-label="Memuat notifikasi">
      <div className="space-y-2">
        <Skeleton className="h-8 w-56 md:ml-8" />
        <Skeleton className="h-4 w-full max-w-2xl md:ml-8" />
      </div>
      <Skeleton className="h-40 rounded-2xl animate-pulse md:h-44" />
      <Skeleton className="h-10 w-full max-w-md rounded-xl animate-pulse" />
      <div className="space-y-4">
        <Skeleton className="min-h-[280px] rounded-2xl animate-pulse" />
        <Skeleton className="min-h-[280px] rounded-2xl animate-pulse" />
      </div>
    </div>
  );
}
