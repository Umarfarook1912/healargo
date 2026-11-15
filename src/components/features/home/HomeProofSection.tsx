import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Images, PlayCircle, ShieldCheck } from "lucide-react";
import { FadeIn, Stagger, StaggerItem } from "@/components/shared/motion";
import { PageContainer } from "@/components/layout/PageContainer";
import { SectionHeading } from "@/components/features/home/SectionHeading";
import { GALLERY_IMAGES, GALLERY_VIDEOS } from "@/constants/gallery";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils/cn";

/** Gallery + certificates teaser built only from the existing gallery constants. */
const PREVIEW_IMAGES = GALLERY_IMAGES.filter((image) => image.category === "products").slice(0, 3);

export function HomeProofSection() {
  if (!PREVIEW_IMAGES.length) return null;

  return (
    <section className="bg-cream/50 py-16 md:py-24">
      <PageContainer>
        <SectionHeading
          eyebrow="Inside Healargo"
          title="See our products and process up close"
          description={`Browse ${GALLERY_IMAGES.length} photos and ${GALLERY_VIDEOS.length} behind-the-scenes videos, or view our quality certificates.`}
        />

        <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
          <Stagger className="grid grid-cols-2 gap-3 sm:gap-4" delay={0.05}>
            {PREVIEW_IMAGES.map((image, index) => (
              <StaggerItem key={image.id} className={cn(index === 0 && "row-span-2")}>
                <Link
                  href={ROUTES.GALLERY}
                  className={cn(
                    "group relative block h-full overflow-hidden rounded-3xl bg-cream ring-1 ring-border/70",
                    index === 0 ? "min-h-[18rem] sm:min-h-[26rem]" : "aspect-[4/3]",
                  )}
                >
                  <Image
                    src={image.imageUrl}
                    alt={image.title}
                    fill
                    sizes="(max-width: 1024px) 50vw, 30vw"
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                  <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-dark/75 via-transparent to-transparent opacity-80 transition-opacity group-hover:opacity-100" />
                  <span className="absolute bottom-3 left-3 rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold text-primary shadow sm:bottom-4 sm:left-4">
                    {image.tag}
                  </span>
                </Link>
              </StaggerItem>
            ))}
          </Stagger>

          <div className="grid gap-5">
            <FadeIn delay={0.1}>
              <Link
                href={ROUTES.GALLERY}
                className="group flex h-full flex-col justify-between gap-8 rounded-3xl border border-border bg-card p-7 shadow-[var(--shadow-soft)] transition-all hover:-translate-y-1 hover:shadow-[var(--shadow-lifted)] sm:p-8"
              >
                <div className="flex items-start justify-between">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-soft text-primary">
                    <Images className="h-5 w-5" />
                  </span>
                  <ArrowUpRight className="h-5 w-5 text-muted transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
                </div>
                <div>
                  <h3 className="font-display text-2xl text-dark">Gallery</h3>
                  <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
                    <span className="inline-flex items-center gap-1.5"><Images className="h-4 w-4 text-accent-strong" />{GALLERY_IMAGES.length} photos</span>
                    <span className="inline-flex items-center gap-1.5"><PlayCircle className="h-4 w-4 text-accent-strong" />{GALLERY_VIDEOS.length} videos</span>
                  </p>
                </div>
              </Link>
            </FadeIn>
            <FadeIn delay={0.18}>
              <Link
                href={ROUTES.CERTIFICATES}
                className="forest-gradient group flex h-full flex-col justify-between gap-8 rounded-3xl p-7 text-cream shadow-[var(--shadow-lifted)] transition-transform hover:-translate-y-1 sm:p-8"
              >
                <div className="flex items-start justify-between">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
                    <ShieldCheck className="h-5 w-5" />
                  </span>
                  <ArrowUpRight className="h-5 w-5 text-cream/60 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent" />
                </div>
                <div>
                  <h3 className="font-display text-2xl text-white">Certificates</h3>
                  <p className="mt-2 text-sm text-cream/75">View our official quality and compliance documents.</p>
                </div>
              </Link>
            </FadeIn>
          </div>
        </div>
      </PageContainer>
    </section>
  );
}
