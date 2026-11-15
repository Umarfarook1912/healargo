/**
 * Deletes ONLY rows that carry the test marker, in foreign-key-safe order.
 * Never truncates, never touches rows without the marker.
 *
 * With `marker = RUN_ID` it removes one run's data; with `marker = MARKER`
 * ("hgtest") it also sweeps leftovers of crashed runs.
 */
import type { PrismaClient } from "@prisma/client";

export async function cleanupTestData(prisma: PrismaClient, marker: string) {
  if (!marker || marker.length < 6 || !marker.toLowerCase().startsWith("hgtest")) {
    throw new Error(`Refusing to clean up with unsafe marker "${marker}"`);
  }
  const upper = marker.toUpperCase();

  const users = await prisma.user.findMany({
    where: { email: { contains: marker } },
    select: { id: true },
  });
  const userIds = users.map((u) => u.id);
  const products = await prisma.product.findMany({
    where: { slug: { contains: marker } },
    select: { id: true },
  });
  const productIds = products.map((p) => p.id);
  const combos = await prisma.combo.findMany({
    where: { OR: [{ slug: { contains: marker } }, { name: { contains: marker } }] },
    select: { id: true },
  });
  const comboIds = combos.map((c) => c.id);

  const counts: Record<string, number> = {};

  counts.reviews = (
    await prisma.review.deleteMany({
      where: {
        OR: [
          { productId: { in: productIds } },
          { userId: { in: userIds } },
          { authorName: { contains: marker } },
        ],
      },
    })
  ).count;

  // order_items cascade with their order.
  const orderItemsOrders = await prisma.orderItem.findMany({
    where: { productId: { in: [...productIds, ...comboIds] } },
    select: { orderId: true },
  });
  counts.orders = (
    await prisma.order.deleteMany({
      where: {
        OR: [
          { userId: { in: userIds } },
          { id: { in: orderItemsOrders.map((o) => o.orderId) } },
          { shippingAddress: { path: ["fullName"], string_contains: marker } },
          { notes: { contains: marker } },
        ],
      },
    })
  ).count;

  counts.whatsappClicks = (
    await prisma.whatsAppClick.deleteMany({
      where: {
        OR: [
          { userId: { in: userIds } },
          { sessionKey: { contains: marker } },
          { pagePath: { contains: marker } },
        ],
      },
    })
  ).count;

  counts.marketingVisits = (
    await prisma.marketingVisit.deleteMany({
      where: { OR: [{ sessionKey: { contains: marker } }, { campaign: { contains: marker } }] },
    })
  ).count;

  counts.coupons = (
    await prisma.coupon.deleteMany({
      where: { OR: [{ code: { startsWith: upper } }, { name: { contains: marker } }] },
    })
  ).count;

  counts.carousels = (
    await prisma.carousel.deleteMany({
      where: { OR: [{ headline: { contains: marker } }, { altText: { contains: marker } }] },
    })
  ).count;

  counts.combos = (await prisma.combo.deleteMany({ where: { id: { in: comboIds } } })).count;
  counts.products = (await prisma.product.deleteMany({ where: { id: { in: productIds } } })).count;
  counts.categories = (
    await prisma.category.deleteMany({
      where: { OR: [{ slug: { contains: marker } }, { name: { contains: marker } }] },
    })
  ).count;
  counts.users = (await prisma.user.deleteMany({ where: { id: { in: userIds } } })).count;

  return counts;
}
