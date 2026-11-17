import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import {
  MapPin,
  Mail,
  Phone,
  Clock,
  Navigation,
  ExternalLink,
  MessageCircle,
  Sparkles,
  Store,
  Compass,
  Share2,
} from "lucide-react";
import { ContactForm } from "@/components/features/contact/ContactForm";
import { SocialLinks } from "@/components/common/SocialLinks";
import { Button } from "@/components/ui/button";
import { PageContainer } from "@/components/layout/PageContainer";
import { ASSETS } from "@/constants/assets";
import { UI } from "@/constants/ui";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { buildWhatsAppUrl } from "@/lib/utils/whatsapp";

export const metadata: Metadata = buildPageMetadata({
  title: "Contact Us",
  description: `Contact ${UI.brand} by phone, email, or WhatsApp for product questions, wellness support, and delivery help.`,
  path: "/contact",
});

export default function ContactPage() {
  const hasWhatsapp = Boolean(UI.whatsappNumber.trim());
  const hasPhones = UI.phones.length > 0;
  const hasMapLinks = Boolean(UI.mapUrl || UI.mapDirectionsUrl || UI.mapEmbedUrl);
  const hasDirections = Boolean(UI.mapDirectionsUrl);
  const hasMapUrl = Boolean(UI.mapUrl);
  const hasEmbed = Boolean(UI.mapEmbedUrl);
  const hasAddress = Boolean(UI.address.trim());

  return (
    <div className="page-wash py-8 sm:py-12 md:py-16">
      <PageContainer>
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-5 flex justify-center">
            <Image
              src={ASSETS.LOGO}
              alt={`${UI.brand} Logo`}
              width={160}
              height={110}
              priority
              className="h-16 w-auto object-contain transition-transform duration-300 hover:scale-105"
            />
          </div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/15 bg-card/80 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-primary shadow-[var(--shadow-soft)]">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Connect & Visit</span>
          </div>
          <h1 className="mt-4 font-display text-4xl leading-[1.08] tracking-tight text-dark md:text-6xl">
            Contact {UI.brand}
          </h1>
          <p className="mt-3 text-base text-muted sm:text-lg">
            We&apos;re here to help with product questions, wellness routines, bulk
            enquiries, and order support. Call, email, or WhatsApp us anytime during
            working hours.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 sm:gap-6">
          <div className="flex flex-col justify-between rounded-3xl border border-[#4F8A45]/25 bg-[#DDECCF]/35 p-6 shadow-[var(--shadow-soft)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-lifted)]">
            <div>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#DDECCF] text-[#4F8A45] shadow-xs">
                <MapPin className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-display text-lg font-bold text-[#263D2E]">
                Visit Us
              </h3>
              <p className="mt-1.5 text-xs leading-relaxed text-[#72776A] sm:text-sm">
                {hasAddress ? UI.address : "Store address will appear here when configured."}
              </p>
            </div>
            {hasMapLinks ? (
              <div className="mt-5 flex flex-col gap-2 pt-4 border-t border-[#4F8A45]/20">
                {hasDirections ? (
                  <Button size="sm" asChild className="gap-1.5 bg-[#4F8A45] hover:bg-[#263D2E] text-white font-bold rounded-full">
                    <a
                      href={UI.mapDirectionsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Navigation className="h-3.5 w-3.5" />
                      Get Directions
                    </a>
                  </Button>
                ) : null}
                {hasMapUrl ? (
                  <Button size="sm" variant="outline" asChild className="gap-1.5 rounded-full border-[#263D2E]/20 text-[#263D2E] bg-white hover:bg-white/90">
                    <a
                      href={UI.mapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Open in Maps
                    </a>
                  </Button>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="flex flex-col justify-between rounded-3xl border border-[#FFD45A]/45 bg-[#FFF0B8]/40 p-6 shadow-[var(--shadow-soft)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-lifted)]">
            <div>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#FFF0B8] text-[#263D2E] shadow-xs">
                <Phone className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-display text-lg font-bold text-[#263D2E]">
                Call Us
              </h3>
              {hasPhones ? (
                <ul className="mt-2 space-y-1.5">
                  {UI.phones.map((phone) => (
                    <li key={phone.digits}>
                      <a
                        href={`tel:${phone.tel}`}
                        className="text-sm font-bold text-[#263D2E] hover:text-[#4F8A45] hover:underline sm:text-base"
                      >
                        {phone.display}
                      </a>
                    </li>
                  ))}
                </ul>
              ) : null}
              <p className="mt-2 text-xs text-[#72776A]">
                Available during working hours for orders and product support.
              </p>
            </div>
            {hasWhatsapp ? (
              <div className="mt-5 flex flex-col gap-2 pt-4 border-t border-[#FFD45A]/30">
                <Button size="sm" variant="whatsapp" asChild className="gap-1.5 rounded-full shadow-xs">
                  <Link
                    href={buildWhatsAppUrl(
                      `Hi ${UI.brand}! I would like to enquire about your products.`,
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    Chat on WhatsApp
                  </Link>
                </Button>
              </div>
            ) : null}
          </div>

          <div className="flex flex-col justify-between rounded-3xl border border-[#8EDBD0]/45 bg-[#D8F3EC]/35 p-6 shadow-[var(--shadow-soft)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-lifted)]">
            <div>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#D8F3EC] text-[#4F8A45] shadow-xs">
                <Mail className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-display text-lg font-bold text-[#263D2E]">
                Email Enquiries
              </h3>
              <a
                href={`mailto:${UI.email}`}
                className="mt-2 inline-block break-all text-sm font-bold text-[#263D2E] hover:text-[#4F8A45] hover:underline"
              >
                {UI.email}
              </a>
              <p className="mt-2 text-xs text-[#72776A]">
                Drop us an email for bulk orders, partnerships, gifting, and support.
              </p>
            </div>
            <div className="mt-5 pt-4 border-t border-[#8EDBD0]/30">
              <Button size="sm" variant="outline" asChild className="w-full gap-1.5 rounded-full border-[#263D2E]/20 text-[#263D2E] bg-white hover:bg-white/90">
                <a href={`mailto:${UI.email}`}>
                  <Mail className="h-3.5 w-3.5" />
                  Send an Email
                </a>
              </Button>
            </div>
          </div>

          {/* Card 4: Working Hours */}
          <div className="flex flex-col justify-between rounded-3xl border border-[#FF8066]/35 bg-[#FFE0D4]/35 p-6 shadow-[var(--shadow-soft)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-lifted)]">
            <div>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#FFE0D4] text-[#FF8066] shadow-xs">
                <Clock className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-display text-lg font-bold text-[#263D2E]">
                Working Hours
              </h3>
              <p className="mt-2 text-sm font-bold text-[#263D2E]">
                {UI.workingHours}
              </p>
              <p className="mt-1 text-xs text-[#72776A]">
                Hours for support, pickups, and customer enquiries.
              </p>
            </div>
            <div className="mt-5 pt-4 border-t border-[#FF8066]/30">
              <div className="inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-white/90 py-2 text-xs font-bold text-[#263D2E] shadow-2xs">
                <Store className="h-3.5 w-3.5 text-[#4F8A45]" />
                Customer Support Ready
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 grid grid-cols-1 items-start gap-8 lg:grid-cols-12 lg:gap-10">
          {hasMapLinks ? (
            <div className="space-y-4 lg:col-span-7">
              <div className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-accent-strong">
                      <Compass className="h-4 w-4" />
                      <span>Navigation & Store Visit</span>
                    </div>
                    <h2 className="mt-1 font-display text-2xl font-semibold text-dark">
                      Find {UI.brand}
                    </h2>
                    <p className="text-xs text-muted sm:text-sm">
                      {hasAddress ? UI.address : "Map details are available below."}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {hasDirections ? (
                      <Button size="sm" asChild className="gap-1.5 shadow-xs">
                        <a
                          href={UI.mapDirectionsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Navigation className="h-3.5 w-3.5" />
                          Get Directions
                        </a>
                      </Button>
                    ) : null}
                    {hasMapUrl ? (
                      <Button size="sm" variant="outline" asChild className="gap-1.5">
                        <a
                          href={UI.mapUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          Open Map
                        </a>
                      </Button>
                    ) : null}
                  </div>
                </div>

                {hasEmbed ? (
                  <div className="relative mt-4 aspect-4/3 w-full overflow-hidden rounded-xl border border-border bg-muted/10 sm:aspect-16/10">
                    <iframe
                      src={UI.mapEmbedUrl}
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      title={`${UI.brand} map location`}
                      className="h-full w-full"
                    />
                  </div>
                ) : null}

                <div className="mt-4 flex flex-col gap-2 rounded-xl bg-cream/70 p-3.5 text-xs text-dark/85 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold text-dark">{UI.brand}</p>
                    <p className="text-muted">
                      {hasAddress ? UI.address : "Location details available on the map links."}
                    </p>
                  </div>
                  {hasDirections ? (
                    <Button size="sm" variant="accent" asChild className="shrink-0 gap-1 text-xs">
                      <a
                        href={UI.mapDirectionsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Navigation className="h-3 w-3" />
                        Start Navigation
                      </a>
                    </Button>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}

          <div className={hasMapLinks ? "lg:col-span-5" : "lg:col-span-12"}>
            <ContactForm />
          </div>
        </div>

        <div className="mt-16 border-t border-border pt-12">
          <div className="mx-auto max-w-2xl text-center">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/15 bg-card/80 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-primary shadow-[var(--shadow-soft)]">
              <Share2 className="h-3.5 w-3.5" />
              <span>Follow Our Community</span>
            </div>
            <h2 className="mt-3 font-display text-2xl text-dark sm:text-3xl">
              Connect with {UI.brand} on Social Media
            </h2>
            <p className="mt-2 text-xs leading-relaxed text-muted sm:text-sm">
              Follow product updates, wellness inspiration, customer stories, and
              new launches across our official channels.
            </p>
          </div>

          <div className="mt-8">
            <SocialLinks variant="cards" />
          </div>
        </div>
      </PageContainer>
    </div>
  );
}
