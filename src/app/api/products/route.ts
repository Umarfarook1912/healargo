import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth/auth";
import {
  mapProduct,
  mapProducts,
  normalizeProductSeo,
  normalizeProductVariants,
} from "@/lib/db/catalog";
import { prisma } from "@/lib/db/prisma";
import { slugify, stripHtml } from "@/lib/utils/format";
import { z } from "zod";
import { USER_ROLES } from "@/constants/auth";

const productSchema = z.object({
  name: z.string().min(2),
  slug: z.string().optional(),
  description: z.string().refine((value) => stripHtml(value).length >= 2),
  shortDescription: z.string().optional(),
  images: z.array(z.string()).default([]),
  videos: z.array(z.string()).default([]),
  categoryId: z.string(),
  variants: z
    .array(
      z.object({
        _id: z.string().optional(),
        label: z.string(),
        sku: z.string(),
        originalPrice: z.number(),
        price: z.number(),
        offerPrice: z.number().optional(),
        available: z.boolean().optional(),
        stock: z.number(),
        image: z.string().optional(),
        weightGrams: z.number().optional(),
      }),
    )
    .min(1),
  tags: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
  isBestSeller: z.boolean().default(false),
  isNewArrival: z.boolean().default(false),
  gstExempt: z.boolean().default(false),
  offerEnabled: z.boolean().default(false),
  offerStartsAt: z.string().optional().nullable(),
  offerEndsAt: z.string().optional().nullable(),
  seo: z
    .object({
      metaTitle: z.string().optional(),
      metaDescription: z.string().optional(),
      metaKeywords: z.array(z.string()).optional(),
      ogImage: z.string().optional(),
      canonicalUrl: z.string().optional(),
    })
    .optional(),
});

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== USER_ROLES.ADMIN) {
    return null;
  }
  return session;
}

function toProductData(input: z.infer<typeof productSchema>) {
  return {
    name: input.name,
    slug: input.slug || slugify(input.name),
    description: input.description,
    shortDescription: input.shortDescription || null,
    images: input.images,
    videos: input.videos,
    categoryId: input.categoryId,
    variants: normalizeProductVariants(input.variants) as unknown as Prisma.InputJsonValue,
    tags: input.tags,
    isActive: input.isActive,
    isBestSeller: input.isBestSeller,
    isNewArrival: input.isNewArrival,
    gstExempt: input.gstExempt,
    offerEnabled: input.offerEnabled,
    offerStartsAt: input.offerStartsAt ? new Date(input.offerStartsAt) : null,
    offerEndsAt: input.offerEndsAt ? new Date(input.offerEndsAt) : null,
    seo: normalizeProductSeo(input.seo) as unknown as Prisma.InputJsonValue,
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query: { isActive?: boolean; isBestSeller?: boolean } = {};
    if (searchParams.get("active") !== "false") query.isActive = true;
    if (searchParams.get("bestSeller") === "true") query.isBestSeller = true;
    const products = await prisma.product.findMany({
      where: query,
      include: { category: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ data: mapProducts(products) });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = productSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const product = await prisma.product.create({
      data: toProductData(parsed.data),
    });

    // Revalidate public caches so newly created products appear immediately
    revalidatePath("/", "layout");
    revalidatePath("/shop");
    revalidatePath("/bestsellers");

    return NextResponse.json({ data: mapProduct(product) });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Create failed" },
      { status: 500 },
    );
  }
}
