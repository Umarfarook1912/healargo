import Link from "next/link";
import { Sparkles } from "lucide-react";
import { UI } from "@/constants/ui";
import { LAYOUT } from "@/constants/layout";
import { buildWhatsAppUrl } from "@/lib/utils/whatsapp";
import { SocialLinks } from "@/components/common/SocialLinks";

export function AnnouncementBar() {
  const hasWhatsapp = Boolean(UI.whatsappNumber.trim());
  const ctaHref = hasWhatsapp
    ? buildWhatsAppUrl(`Hi ${UI.brand}! I'd like to know more about your natural products.`)
    : `mailto:${UI.email}`;
  const ctaLabel = hasWhatsapp ? "Order on WhatsApp" : `Email ${UI.email}`;

  return (
    <div className="border-b border-[#263D2E]/10 bg-[#FFD45A] py-2 text-[11px] leading-snug font-medium text-[#263D2E] sm:text-xs">
      <div className={`${LAYOUT.container} flex items-center justify-between gap-3`}>
        <p className="min-w-0 flex-1 text-center md:text-left flex items-center justify-center md:justify-start gap-2">
          <span className="inline-flex items-center gap-1.5 font-bold text-[#263D2E]">
            <Sparkles className="h-3.5 w-3.5 text-[#263D2E] animate-pulse-gentle" />
            {UI.announcement}
          </span>
          <span className="mx-2 hidden opacity-40 sm:inline">•</span>
          <Link
            href={ctaHref}
            className="hidden font-bold text-[#263D2E] underline decoration-[#263D2E]/40 underline-offset-4 transition hover:decoration-[#263D2E] sm:inline"
            target={hasWhatsapp ? "_blank" : undefined}
            rel={hasWhatsapp ? "noopener noreferrer" : undefined}
          >
            {ctaLabel}
          </Link>
        </p>
        <div className="hidden shrink-0 items-center gap-2 border-l border-[#263D2E]/15 pl-4 md:flex">
          <span className="text-[11px] font-semibold text-[#263D2E]/80">{UI.follow}</span>
          <SocialLinks variant="header" />
        </div>
      </div>
    </div>
  );
}
