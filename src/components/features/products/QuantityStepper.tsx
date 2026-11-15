export function QuantityStepper({
  quantity,
  available,
  onQuantity,
  compact = false,
}: {
  quantity: number;
  available: boolean;
  onQuantity: (next: number) => void;
  compact?: boolean;
}) {
  const buttonClass = compact
    ? "h-10 w-10 rounded-full text-lg text-dark transition hover:bg-primary-soft hover:text-primary disabled:opacity-40"
    : "h-11 w-11 rounded-full text-lg text-dark transition hover:bg-primary-soft hover:text-primary disabled:opacity-40";
  return (
    <div
      className={
        compact
          ? "flex shrink-0 items-center rounded-full border border-border bg-card"
          : "flex items-center rounded-full border border-input bg-card"
      }
    >
      <button type="button" className={buttonClass} onClick={() => onQuantity(Math.max(1, quantity - 1))}>
        −
      </button>
      <span className={compact ? "w-6 text-center text-sm font-semibold" : "w-10 text-center font-semibold"}>
        {quantity}
      </span>
      <button
        type="button"
        className={buttonClass}
        onClick={() => onQuantity(quantity + 1)}
        disabled={!available}
      >
        +
      </button>
    </div>
  );
}
