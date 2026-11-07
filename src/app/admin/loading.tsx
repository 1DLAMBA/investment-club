import { SkeletonNav, Skeleton } from "@/components/Skeleton";

export default function AdminLoading() {
  return (
    <div className="min-h-screen">
      <SkeletonNav />
      <main className="mx-auto max-w-4xl space-y-8 px-4 py-8 sm:space-y-10 sm:px-6 sm:py-10">
        <div>
          <Skeleton className="mb-4 h-5 w-32" />
          <Skeleton className="h-48 w-full rounded-lg" />
        </div>
        <div>
          <Skeleton className="mb-4 h-5 w-24" />
          <Skeleton className="h-24 w-full rounded-lg" />
        </div>
      </main>
    </div>
  );
}
