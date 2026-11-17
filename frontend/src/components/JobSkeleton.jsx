export function JobCardSkeleton() {
  return (
    <div className="rounded-2xl border border-line bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="skeleton h-5 w-2/3 rounded-md" />
        <div className="skeleton h-5 w-16 rounded-full" />
      </div>
      <div className="skeleton mt-3 h-4 w-1/3 rounded-md" />
      <div className="mt-5 flex flex-wrap gap-2">
        <div className="skeleton h-6 w-20 rounded-full" />
        <div className="skeleton h-6 w-16 rounded-full" />
        <div className="skeleton h-6 w-24 rounded-full" />
      </div>
      <div className="mt-6 flex items-center justify-between">
        <div className="skeleton h-4 w-28 rounded-md" />
        <div className="skeleton h-9 w-20 rounded-xl" />
      </div>
    </div>
  );
}

export function JobListSkeleton({ count = 6 }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {Array.from({ length: count }).map((_, i) => (
        <JobCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-line bg-white p-4">
          <div className="skeleton h-3 w-20 rounded" />
          <div className="skeleton mt-3 h-7 w-16 rounded" />
        </div>
      ))}
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-line bg-white p-6 md:p-8">
        <div className="skeleton h-4 w-24 rounded" />
        <div className="skeleton mt-4 h-9 w-3/4 rounded" />
        <div className="skeleton mt-3 h-5 w-1/3 rounded" />
        <div className="mt-6 flex flex-wrap gap-2">
          <div className="skeleton h-7 w-24 rounded-full" />
          <div className="skeleton h-7 w-20 rounded-full" />
          <div className="skeleton h-7 w-28 rounded-full" />
        </div>
      </div>
      <div className="rounded-2xl border border-line bg-white p-6 md:p-8">
        <div className="skeleton h-5 w-40 rounded" />
        <div className="skeleton mt-4 h-4 w-full rounded" />
        <div className="skeleton mt-2 h-4 w-full rounded" />
        <div className="skeleton mt-2 h-4 w-2/3 rounded" />
      </div>
    </div>
  );
}
