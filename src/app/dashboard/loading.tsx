import { SkeletonNav, SkeletonCard, Skeleton } from "@/components/Skeleton";

export default function DashboardLoading() {
  return (
    <div className="min-h-screen">
      <SkeletonNav />
      <main className="mx-auto max-w-4xl space-y-8 px-4 py-8 sm:space-y-10 sm:px-6 sm:py-10">
        <SkeletonCard />
        <div>
          <Skeleton className="mb-4 h-5 w-40" />
          <div className="grid gap-4 sm:grid-cols-2">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </div>
      </main>
    </div>
  );
}
