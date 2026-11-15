import { HeartHandshake, Leaf, ShieldCheck, Truck } from "lucide-react";

/** Same trust copy as the home page trust strip. */
const TRUST_ITEMS = [
  { icon: Leaf, title: "Natural Focus", description: "Chosen for everyday wellness" },
  { icon: ShieldCheck, title: "Quality First", description: "Reviewed before listing" },
  { icon: Truck, title: "Pan-India Delivery", description: "Shipping across India" },
  { icon: HeartHandshake, title: "Honest Support", description: "Email and WhatsApp help" },
] as const;

export function ProductTrustRow() {
  return (
    <ul className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border bg-border">
      {TRUST_ITEMS.map(({ icon: Icon, title, description }) => (
        <li key={title} className="flex items-center gap-2.5 bg-card px-3 py-2.5">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
            <Icon className="h-3.5 w-3.5" />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-[12.5px] font-semibold leading-tight text-dark">{title}</span>
            <span className="mt-0.5 block truncate text-[11px] leading-snug text-muted">{description}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}