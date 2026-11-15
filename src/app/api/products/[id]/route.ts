import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth/auth";
import { isAdminSession } from "@/lib/auth/require-admin";
import {
  mapProduct,
  normalizeProductSeo,
  normalizeProductVariants,
} from "@/lib/db/catalog";
import { prisma } from "@/lib/db/prisma";
import { isDbId } from "@/lib/db/serialize";
import { slugify } from "@/lib/utils/format";
import {
  parseOptionalDate,
  productUpdateSchema,
  uniqueSlug,
  zodErrorMessage,
} from "@/lib/catalog/validation";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    if (!isDbId(id)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }
    const product = await prisma.product.findUnique({
      where: { id },
      include: { category: true },
    });
    if (!product || (!product.isActive && !(await isAdminSession(await auth())))) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ data: mapProduct(product) });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed" },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user || !(await isAdminSession(session))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    if (!isDbId(id)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }
    const parsed = productUpdateSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: zodErrorMessage(parsed.error, "Invalid product data") },
        { status: 400 },
      );
    }
    const body = parsed.data;

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (body.categoryId && body.categoryId !== existing.categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: body.categoryId },
        select: { id: true },
      });
      if (!category) {
        return NextResponse.json({ error: "Category not found" }, { status: 400 });
      }
    }

    // Renaming keeps the slug (shared links and SEO). Only an explicit slug changes it.
    let slug: string | undefined;
    if (body.slug !== undefined) {
      const wanted = slugify(body.slug || body.name || existing.name);
      slug =
        wanted === existing.slug
          ? wanted
          : await uniqueSlug(wanted, async (candidate) =>
              Boolean(
                await prisma.product.findFirst({
                  where: { slug: candidate, NOT: { id } },
                  select: { id: true },
                }),
              ),
            );
    }

    const product = await prisma.product.update({
      where: { id },
      data: {
        ...body,
        slug,
        shortDescription:
          body.shortDescription === undefined
            ? undefined
            : body.shortDescription || null,
        variants:
          body.variants === undefined
            ? undefined
            : (normalizeProductVariants(body.variants) as unknown as Prisma.InputJsonValue),
        seo:
          body.seo === undefined
            ? undefined
            : (normalizeProductSeo(body.seo) as unknown as Prisma.InputJsonValue),
        offerStartsAt:
          body.offerStartsAt === undefined
            ? undefined
            : parseOptionalDate(body.offerStartsAt),
        offerEndsAt:
          body.offerEndsAt === undefined
            ? undefined
            : parseOptionalDate(body.offerEndsAt),
      },
    });

    const productObj = product as { slug?: string };

    // Revalidate public page caches
    revalidatePath("/", "layout");
    revalidatePath("/shop");
    revalidatePath("/bestsellers");
    if (productObj.slug) {
      revalidatePath(`/products/${productObj.slug}`);
    }

    return NextResponse.json({ data: mapProduct(product) });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Update failed" },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user || !(await isAdminSession(session))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    if (!isDbId(id)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }
    const deletedProduct = await prisma.product.findUnique({
      where: { id },
      select: { slug: true },
    });
    if (!deletedProduct) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Products that appear in orders are archived (hidden from the shop) instead
    // of deleted, so order history, exports and refunds keep working.
    const orderedCount = await prisma.orderItem.count({ where: { productId: id } });
    let archived = false;
    if (orderedCount > 0) {
      await prisma.product.update({ where: { id }, data: { isActive: false } });
      archived = true;
    } else {
      await prisma.product.deleteMany({ where: { id } });
    }

    revalidatePath("/", "layout");
    revalidatePath("/shop");
    revalidatePath("/bestsellers");
    if (deletedProduct.slug) {
      revalidatePath(`/products/${deletedProduct.slug}`);
    }

    return NextResponse.json({
      data: {
        ok: true,
        archived,
        ...(archived
          ? { message: "Product has orders, so it was deactivated instead of deleted" }
          : {}),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Delete failed" },
      { status: 500 },
    );
  }
}
