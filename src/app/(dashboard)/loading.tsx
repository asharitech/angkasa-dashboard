export default function Loading() {
  return (
    <div className="space-y-6">
      {/* PageHeader skeleton */}
      <div className="h-8 w-48 bg-muted animate-pulse rounded" />

      {/* Card skeletons */}
      <div className="h-24 bg-muted animate-pulse rounded-xl" />
      <div className="h-24 bg-muted animate-pulse rounded-xl" />
      <div className="h-24 bg-muted animate-pulse rounded-xl" />
    </div>
  );
}
