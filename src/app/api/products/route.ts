import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth/auth";
import { isAdminSession } from "@/lib/auth/require-admin";
import {
  mapProduct,
  mapProducts,
  normalizeProductSeo,
  normalizeProductVariants,
} from "@/lib/db/catalog";
import { prisma } from "@/lib/db/prisma";
import { slugify } from "@/lib/utils/format";
import {
  productSchema,
  uniqueSlug,
  zodErrorMessage,
  type ProductInput,
} from "@/lib/catalog/validation";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || !(await isAdminSession(session))) {
    return null;
  }
  return session;
}

async function productSlugTaken(slug: string) {
  return Boolean(
    await prisma.product.findUnique({ where: { slug }, select: { id: true } }),
  );
}

function toProductData(input: ProductInput, slug: string) {
  return {
    name: input.name,
    slug,
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
    // Inactive products are only listed for admins (the admin combo form uses ?active=false).
    if (searchParams.get("active") !== "false" || !(await requireAdmin())) {
      query.isActive = true;
    }
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
      return NextResponse.json(
        { error: zodErrorMessage(parsed.error, "Invalid product data") },
        { status: 400 },
      );
    }

    const category = await prisma.category.findUnique({
      where: { id: parsed.data.categoryId },
      select: { id: true },
    });
    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 400 });
    }

    const slug = await uniqueSlug(
      slugify(parsed.data.slug || parsed.data.name),
      productSlugTaken,
    );
    const product = await prisma.product.create({
      data: toProductData(parsed.data, slug),
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
