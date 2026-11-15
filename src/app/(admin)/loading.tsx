export default function AdminLoading() {
  return (
    <div className="space-y-6" aria-busy="true">
      <span className="sr-only">Loading admin…</span>
      <div className="border-b border-border/70 pb-6">
        <div className="h-9 w-56 animate-pulse rounded-full bg-cream-dark/70" />
        <div className="mt-3 h-4 w-80 max-w-full animate-pulse rounded-full bg-cream-dark/50" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="h-32 animate-pulse rounded-2xl border border-border bg-card" />
        ))}
      </div>
      <div className="h-80 animate-pulse rounded-2xl border border-border bg-card" />
    </div>
  );
}
