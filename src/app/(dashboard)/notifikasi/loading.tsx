import { Skeleton } from "@/components/ui/skeleton";

export default function NotifikasiLoading() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6" aria-busy="true" aria-label="Memuat notifikasi">
      <div className="space-y-2 md:pl-8">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-full max-w-xl" />
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl animate-pulse" />
        ))}
      </div>
      <Skeleton className="h-36 rounded-xl animate-pulse" />
      <Skeleton className="h-36 rounded-xl animate-pulse" />
    </div>
  );
}
