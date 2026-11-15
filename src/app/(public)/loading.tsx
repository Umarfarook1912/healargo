export default function Loading() {
  return (
    <div className="page-container py-10 md:py-14" aria-busy="true">
      <span className="sr-only">Loading…</span>
      <div className="h-8 w-48 animate-pulse rounded-full bg-cream-dark/70" />
      <div className="mt-3 h-4 w-72 max-w-full animate-pulse rounded-full bg-cream-dark/50" />
      <div className="mt-10 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {Array.from({ length: 10 }, (_, index) => (
          <div key={index} className="rounded-2xl border border-border bg-card p-3">
            <div className="aspect-square animate-pulse rounded-xl bg-cream" />
            <div className="mt-3 h-4 w-4/5 animate-pulse rounded-full bg-cream-dark/60" />
            <div className="mt-2 h-3 w-1/2 animate-pulse rounded-full bg-cream-dark/40" />
            <div className="mt-4 h-8 animate-pulse rounded-full bg-cream" />
          </div>
        ))}
      </div>
    </div>
  );
}
