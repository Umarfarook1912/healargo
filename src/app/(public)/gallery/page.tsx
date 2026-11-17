import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Home, Film } from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";
import { GalleryClient } from "@/components/features/gallery/GalleryClient";
import { ASSETS } from "@/constants/assets";
import { ROUTES } from "@/constants/routes";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { getProducts } from "@/lib/products/queries";
import { getLiveCombos } from "@/lib/catalog/highlights";
import { getActiveCarousels } from "@/lib/carousels/queries";
import { buildDynamicGalleryImages } from "@/lib/gallery/build-gallery";
import { GALLERY_VIDEOS } from "@/constants/gallery";
import type { Product } from "@/types/product";
import type { ComboOffer } from "@/types/combo";
import type { CarouselSlide } from "@/types/carousel";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = buildPageMetadata({
  title: "Visual Gallery — Natural Extraction & Sourcing Highlights",
  description:
    "Explore HEALARGO product videos, packaging updates, natural extraction, and visual highlights from across the catalog.",
  path: "/gallery",
  keywords: [
    "HEALARGO gallery",
    "cold pressed oil extraction video",
    "pure wood pressed oil",
    "natural edible oils",
    "HEALARGO products",
  ],
});

export default async function GalleryPage() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  let products: Product[] = [];
  let combos: ComboOffer[] = [];
  let carousels: CarouselSlide[] = [];

  try {
    [products, combos, carousels] = await Promise.all([
      getProducts({ activeOnly: true }),
      getLiveCombos(),
      getActiveCarousels(),
    ]);
  } catch {
    products = [];
    combos = [];
    carousels = [];
  }

  // Build gallery items only from available products (active with stock) and live combos
  const galleryImages = buildDynamicGalleryImages(products, combos, carousels);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: siteUrl,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Visual Gallery",
            item: `${siteUrl}${ROUTES.GALLERY}`,
          },
        ],
      },
      {
        "@type": "ImageGallery",
        name: "HEALARGO Visual Gallery",
        description:
          "Product videos, order packing footage, direct selling highlights, and pure cold-pressed oils.",
        url: `${siteUrl}${ROUTES.GALLERY}`,
      },
      ...GALLERY_VIDEOS.map((v) => ({
        "@type": "VideoObject",
        name: v.title,
        description: v.description,
        thumbnailUrl: v.youtubeId
          ? `https://img.youtube.com/vi/${v.youtubeId}/hqdefault.jpg`
          : `${siteUrl}${ASSETS.LOGO_PNG}`,
        uploadDate: v.date ? "2026-10-26T00:00:00+05:30" : "2026-10-15T00:00:00+05:30",
        contentUrl: v.videoUrl,
        embedUrl: v.youtubeId
          ? `https://www.youtube.com/embed/${v.youtubeId}`
          : v.videoUrl,
      })),
    ],
  };

  return (
    <div className="page-wash py-8 sm:py-12 md:py-16">
      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <PageContainer>
        {/* Breadcrumb Navigation */}
        <nav
          aria-label="Breadcrumbs"
          className="mb-8 flex items-center gap-1.5 text-xs text-muted"
        >
          <Link
            href={ROUTES.HOME}
            className="flex items-center gap-1 transition-colors hover:text-primary"
          >
            <Home className="h-3.5 w-3.5" />
            <span>Home</span>
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-muted" />
          <span className="font-medium text-dark" aria-current="page">
            Visual Gallery
          </span>
        </nav>

        {/* Hero Section */}
        <div className="max-w-3xl mb-10">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-card/80 px-3.5 py-1 text-xs font-semibold text-primary shadow-[var(--shadow-soft)]">
            <Film className="h-3.5 w-3.5" />
            <span>Extraction Videos, Order Packing & Direct Selling Gallery</span>
          </div>

          <h1 className="font-display text-4xl leading-[1.08] tracking-tight text-dark md:text-6xl">
            HEALARGO Visual Gallery
          </h1>

          <p className="mt-3 text-base sm:text-lg text-muted leading-relaxed">
            Explore product highlights, process videos, customer packing footage,
            and natural agro supply visuals from the HEALARGO catalog.
          </p>
        </div>

        {/* Gallery Client Component with Dynamic Available Items */}
        <GalleryClient initialImages={galleryImages} />
      </PageContainer>
    </div>
  );
}
