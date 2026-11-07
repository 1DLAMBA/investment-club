export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-md bg-ink/10 ${className}`} />
  );
}

export function SkeletonNav() {
  return (
    <div className="sticky top-0 z-10 border-b border-brass/20 bg-vault">
      <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4 sm:px-6">
        <div className="h-7 w-40 animate-pulse rounded-md bg-paper/10" />
        <div className="h-7 w-16 animate-pulse rounded-md bg-paper/10" />
      </div>
    </div>
  );
}

export function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div
      className={`rounded-lg border border-brass/15 bg-paper p-5 sm:p-6 ${className}`}
    >
      <Skeleton className="h-3 w-24" />
      <Skeleton className="mt-3 h-9 w-40" />
      <Skeleton className="mt-3 h-3 w-full max-w-xs" />
    </div>
  );
}
