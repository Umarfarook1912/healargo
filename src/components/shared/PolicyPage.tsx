import type { Metadata } from "next";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHero } from "@/components/shared/PageHero";
import { LAYOUT } from "@/constants/layout";
import { buildPageMetadata } from "@/lib/seo/metadata";

export function PolicyPage({
  title,
  intro,
  sections,
  path,
}: {
  title: string;
  intro: string;
  sections: { title: string; body: string }[];
  path: string;
}) {
  return (
    <>
      <PageHero eyebrow="HEALARGO policies" title={title} description={intro} />
      <PageContainer className="py-12 md:py-16">
        <div className={LAYOUT.narrow}>
          <div className="space-y-5">
            {sections.map((section, index) => (
              <section key={section.title} className="surface-card p-6 sm:p-8">
                <div className="flex items-start gap-4">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-soft text-sm font-semibold text-primary">
                    {index + 1}
                  </span>
                  <div>
                    <h2 className="font-display text-2xl text-dark">{section.title}</h2>
                    <p className="mt-2 leading-relaxed text-dark/80">{section.body}</p>
                  </div>
                </div>
              </section>
            ))}
          </div>
          <span className="sr-only">{path}</span>
        </div>
      </PageContainer>
    </>
  );
}

export function policyMetadata(
  title: string,
  description: string,
  path: string,
): Metadata {
  return buildPageMetadata({ title, description, path });
}
