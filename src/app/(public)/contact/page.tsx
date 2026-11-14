import type { Metadata } from "next";
import Link from "next/link";
import {
  MapPin,
  Mail,
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
import { UI } from "@/constants/ui";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { buildWhatsAppUrl } from "@/lib/utils/whatsapp";

export const metadata: Metadata = buildPageMetadata({
  title: "Contact Us",
  description: `Contact ${UI.brand} by email${UI.whatsappNumber ? " or WhatsApp" : ""} for product questions, wellness support, and delivery help.`,
  path: "/contact",
});

export default function ContactPage() {
  const hasWhatsapp = Boolean(UI.whatsappNumber.trim());
  const hasMapLinks = Boolean(UI.mapUrl || UI.mapDirectionsUrl || UI.mapEmbedUrl);
  const hasDirections = Boolean(UI.mapDirectionsUrl);
  const hasMapUrl = Boolean(UI.mapUrl);
  const hasEmbed = Boolean(UI.mapEmbedUrl);
  const hasAddress = Boolean(UI.address.trim());

  return (
    <div className="py-8 sm:py-12 md:py-16">
      <PageContainer>
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Connect & Visit</span>
          </div>
          <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight text-dark sm:text-4xl md:text-5xl">
            Contact {UI.brand}
          </h1>
          <p className="mt-3 text-base text-muted sm:text-lg">
            We&apos;re here to help with product questions, wellness routines, bulk
            enquiries, and order support. Reach out by email or WhatsApp, and visit
            us if location details are available.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 sm:gap-6">
          <div className="flex flex-col justify-between rounded-2xl border border-border bg-card p-5 shadow-xs transition-shadow hover:shadow-md">
            <div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <MapPin className="h-5 w-5" />
              </div>
              <h3 className="mt-3 font-display text-lg font-semibold text-dark">
                Visit Us
              </h3>
              <p className="mt-1.5 text-xs leading-relaxed text-muted sm:text-sm">
                {hasAddress ? UI.address : "Store address will appear here when configured."}
              </p>
            </div>
            {hasMapLinks ? (
              <div className="mt-4 flex flex-col gap-2 pt-3 border-t border-border/60">
                {hasDirections ? (
                  <Button size="sm" asChild className="gap-1.5">
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
                      Open in Maps
                    </a>
                  </Button>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="flex flex-col justify-between rounded-2xl border border-border bg-card p-5 shadow-xs transition-shadow hover:shadow-md">
            <div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/20 text-accent-foreground">
                <MessageCircle className="h-5 w-5" />
              </div>
              <h3 className="mt-3 font-display text-lg font-semibold text-dark">
                WhatsApp Support
              </h3>
              <p className="mt-1.5 text-sm font-semibold text-dark sm:text-base">
                {hasWhatsapp
                  ? "Chat with us for product help and order support."
                  : "WhatsApp support will appear here when configured."}
              </p>
              <p className="mt-1 text-xs text-muted">
                Reach us quickly for product questions, bulk enquiries, and updates.
              </p>
            </div>
            {hasWhatsapp ? (
              <div className="mt-4 flex flex-col gap-2 pt-3 border-t border-border/60">
                <Button size="sm" variant="whatsapp" asChild className="gap-1.5">
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

          <div className="flex flex-col justify-between rounded-2xl border border-border bg-card p-5 shadow-xs transition-shadow hover:shadow-md">
            <div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Mail className="h-5 w-5" />
              </div>
              <h3 className="mt-3 font-display text-lg font-semibold text-dark">
                Email Enquiries
              </h3>
              <a
                href={`mailto:${UI.email}`}
                className="mt-1.5 inline-block break-all text-sm font-semibold text-dark hover:text-primary hover:underline"
              >
                {UI.email}
              </a>
              <p className="mt-1 text-xs text-muted">
                Drop us an email for bulk orders, partnerships, gifting, and support.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-border/60">
              <Button size="sm" variant="outline" asChild className="w-full gap-1.5">
                <a href={`mailto:${UI.email}`}>
                  <Mail className="h-3.5 w-3.5" />
                  Send an Email
                </a>
              </Button>
            </div>
          </div>

          {/* Card 4: Working Hours */}
          <div className="flex flex-col justify-between rounded-2xl border border-border bg-card p-5 shadow-xs transition-shadow hover:shadow-md">
            <div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cream-dark text-dark">
                <Clock className="h-5 w-5" />
              </div>
              <h3 className="mt-3 font-display text-lg font-semibold text-dark">
                Working Hours
              </h3>
              <p className="mt-1.5 text-sm font-semibold text-dark">
                {UI.workingHours}
              </p>
              <p className="mt-1 text-xs text-muted">
                Hours for support, pickups, and customer enquiries.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-border/60">
              <div className="inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-cream/80 py-1.5 text-xs font-medium text-dark/80">
                <Store className="h-3.5 w-3.5 text-primary" />
                <span>Open Today</span>
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
                    <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-accent">
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
            <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
              <Share2 className="h-3.5 w-3.5" />
              <span>Follow Our Community</span>
            </div>
            <h2 className="mt-3 font-display text-2xl font-bold text-dark sm:text-3xl">
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
