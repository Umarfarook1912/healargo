import { cn } from "@/lib/utils/cn";

/** Friendly empty / zero-data panel used across store and admin pages. */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mx-auto flex max-w-lg flex-col items-center rounded-3xl border border-dashed border-border bg-card/70 px-6 py-14 text-center",
        className,
      )}
    >
      {icon ? (
        <span className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-soft text-primary ring-1 ring-primary/10 [&_svg]:h-7 [&_svg]:w-7">
          {icon}
        </span>
      ) : null}
      <h2 className="font-display text-2xl text-dark">{title}</h2>
      {description ? (
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted">{description}</p>
      ) : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
