import { Leaf, ShieldCheck, Truck, Sparkles } from "lucide-react";

/** Brand benefits matching the Playful Nature 3.0 design system. */
const TRUST_ITEMS = [
  {
    icon: Leaf,
    badgeBg: "bg-[#DDECCF]",
    iconColor: "text-[#4F8A45]",
    cardBg: "bg-[#DDECCF]/35 border-[#4F8A45]/25",
    title: "Naturally Sourced",
    description: "Zero chemical refining or artificial additives",
  },
  {
    icon: ShieldCheck,
    badgeBg: "bg-[#FFF0B8]",
    iconColor: "text-[#263D2E]",
    cardBg: "bg-[#FFF0B8]/40 border-[#FFD45A]/40",
    title: "Cold-Pressed Purity",
    description: "Gently extracted to keep fresh aroma intact",
  },
  {
    icon: Sparkles,
    badgeBg: "bg-[#FFE0D4]",
    iconColor: "text-[#FF8066]",
    cardBg: "bg-[#FFE0D4]/35 border-[#FF8066]/30",
    title: "Everyday Goodness",
    description: "Wholesome culinary nourishment for families",
  },
  {
    icon: Truck,
    badgeBg: "bg-[#D8F3EC]",
    iconColor: "text-[#4F8A45]",
    cardBg: "bg-[#D8F3EC]/35 border-[#8EDBD0]/40",
    title: "Doorstep Delivery",
    description: "Packed securely and dispatched across India",
  },
] as const;

export function ProductTrustRow() {
  return (
    <ul className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
      {TRUST_ITEMS.map(({ icon: Icon, badgeBg, iconColor, cardBg, title, description }) => (
        <li
          key={title}
          className={`flex items-center gap-3 rounded-2xl border ${cardBg} p-3 transition-transform hover:-translate-y-0.5`}
        >
          <span
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${badgeBg} ${iconColor} shadow-2xs`}
          >
            <Icon className="h-4 w-4" />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-xs font-bold text-[#263D2E]">{title}</span>
            <span className="block truncate text-[11px] text-[#72776A]">{description}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}
