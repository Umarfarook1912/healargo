import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth/auth";
import {
  mapProduct,
  normalizeProductSeo,
  normalizeProductVariants,
} from "@/lib/db/catalog";
import { prisma } from "@/lib/db/prisma";
import { isDbId } from "@/lib/db/serialize";
import { slugify } from "@/lib/utils/format";
import { USER_ROLES } from "@/constants/auth";

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
    if (!product) {
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
  if (!session?.user || session.user.role !== USER_ROLES.ADMIN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    if (!isDbId(id)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    if (body.name && !body.slug) {
      body.slug = slugify(body.name);
    }

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const product = await prisma.product.update({
      where: { id },
      data: {
        ...body,
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
            : body.offerStartsAt
              ? new Date(body.offerStartsAt)
              : null,
        offerEndsAt:
          body.offerEndsAt === undefined
            ? undefined
            : body.offerEndsAt
              ? new Date(body.offerEndsAt)
              : null,
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
  if (!session?.user || session.user.role !== USER_ROLES.ADMIN) {
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
    await prisma.product.deleteMany({ where: { id } });

    revalidatePath("/", "layout");
    revalidatePath("/shop");
    revalidatePath("/bestsellers");
    if (deletedProduct?.slug) {
      revalidatePath(`/products/${deletedProduct.slug}`);
    }

    return NextResponse.json({ data: { ok: true } });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Delete failed" },
      { status: 500 },
    );
  }
}
