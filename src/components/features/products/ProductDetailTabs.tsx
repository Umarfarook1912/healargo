"use client";

import { useEffect, useState } from "react";
import * as Tabs from "@radix-ui/react-tabs";
import { ProductReviews } from "@/components/features/reviews/ProductReviews";
import { API_ENDPOINTS } from "@/constants/api";
import { CATALOG_COPY } from "@/constants/catalog";
import type { Review } from "@/types/review";

const triggerClass =
  "relative inline-flex h-12 items-center justify-center gap-1.5 px-1 text-sm font-medium text-muted transition-colors hover:text-dark after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:rounded-full after:bg-transparent after:transition-colors data-[state=active]:font-semibold data-[state=active]:text-primary data-[state=active]:after:bg-primary sm:text-base";

export function ProductDetailTabs({
  description,
  productId,
}: {
  description: string;
  productId?: string;
}) {
  const [reviews, setReviews] = useState<Review[]>([]);

  useEffect(() => {
    if (!productId) return;
    fetch(`${API_ENDPOINTS.REVIEWS}?productId=${productId}`)
      .then((response) => response.json())
      .then((json) => setReviews(json.data ?? []))
      .catch(() => setReviews([]));
  }, [productId]);

  return (
    <Tabs.Root defaultValue="description" className="mt-10 lg:mt-20">
      <Tabs.List className="flex gap-7 overflow-x-auto border-b border-border sm:gap-10">
        <Tabs.Trigger value="description" className={triggerClass}>
          {CATALOG_COPY.detailDescription}
        </Tabs.Trigger>
        {productId ? (
          <Tabs.Trigger value="reviews" className={triggerClass}>
            {CATALOG_COPY.detailReviews}
            {reviews.length > 0 ? (
              <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-bold leading-none text-accent-strong">
                {reviews.length}
              </span>
            ) : null}
          </Tabs.Trigger>
        ) : null}
      </Tabs.List>

      <Tabs.Content value="description" className="mt-5 focus-visible:outline-none lg:mt-8">
        <div className="surface-card p-5 sm:p-7 lg:p-10">
          <div
            className="prose prose-sm max-w-3xl text-sm text-dark/80 sm:text-[15px] prose-headings:font-semibold prose-headings:text-dark prose-p:my-1 prose-p:leading-relaxed prose-strong:text-dark prose-img:my-3 prose-img:h-auto prose-img:w-full prose-img:rounded-xl [&_iframe]:my-3 [&_iframe]:h-[185px] [&_iframe]:w-full [&_iframe]:max-w-lg [&_iframe]:rounded-xl sm:[&_iframe]:h-[260px]"
            dangerouslySetInnerHTML={{ __html: description }}
          />
        </div>
      </Tabs.Content>

      {productId ? (
        <Tabs.Content value="reviews" className="mt-5 focus-visible:outline-none lg:mt-8">
          <div className="surface-card p-5 sm:p-7 lg:p-10">
            <ProductReviews productId={productId} reviews={reviews} />
          </div>
        </Tabs.Content>
      ) : null}
    </Tabs.Root>
  );
}
