import { mapCarousel, mapCarousels } from "@/lib/db/catalog";
import { prisma } from "@/lib/db/prisma";
import type { CarouselSlide } from "@/types/carousel";

/**
 * Fetch active carousel slides for the public storefront.
 * Sorted by sortOrder ascending, then createdAt ascending.
 */
export async function getActiveCarousels(): Promise<CarouselSlide[]> {
  try {
    const slides = await prisma.carousel.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });
    return mapCarousels(slides);
  } catch (error) {
    console.error("Error fetching active carousels:", error);
    return [];
  }
}

/**
 * Fetch all carousel slides (active and inactive) for the admin console.
 * Sorted by sortOrder ascending, then createdAt ascending.
 */
export async function getAllCarousels(): Promise<CarouselSlide[]> {
  try {
    const slides = await prisma.carousel.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });
    return mapCarousels(slides);
  } catch (error) {
    console.error("Error fetching all carousels for admin:", error);
    return [];
  }
}

/**
 * Fetch a single carousel slide by ID.
 */
export async function getCarouselById(id: string): Promise<CarouselSlide | null> {
  try {
    const slide = await prisma.carousel.findUnique({ where: { id } });
    if (!slide) return null;
    return mapCarousel(slide);
  } catch (error) {
    console.error(`Error fetching carousel ${id}:`, error);
    return null;
  }
}
