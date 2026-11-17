import type { Metadata } from "next";
import { Suspense } from "react";
import { AttributionCapture } from "@/components/features/attribution/AttributionCapture";
import { NotFoundLandingView } from "@/components/features/not-found/NotFoundLandingView";
import { Footer } from "@/components/layout/Footer/Footer";
import { Header } from "@/components/layout/Header/Header";
import { NotFoundSessionBoundary } from "@/components/providers/NotFoundSessionBoundary";
import { getCategories } from "@/lib/products/queries";
import type { Category } from "@/types/product";

export const metadata: Metadata = {
  title: "404 - Page Not Found | HEALARGO",
  description: "The requested page was not found. Explore HEALARGO natural oils and agro-wellness essentials.",
};

export default async function RootNotFound() {
  let categories: Category[] = [];
  try {
    categories = await getCategories();
  } catch {
    categories = [];
  }

  return (
    <NotFoundSessionBoundary>
      <Suspense fallback={null}>
        <AttributionCapture />
      </Suspense>
      <Header categories={categories} />
      <main className="min-h-[70vh]">
        <NotFoundLandingView />
      </main>
      <Footer />
    </NotFoundSessionBoundary>
  );
}
