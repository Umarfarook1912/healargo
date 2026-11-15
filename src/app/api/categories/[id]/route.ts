import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth/auth";
import { isAdminSession } from "@/lib/auth/require-admin";
import { isDbId } from "@/lib/db/serialize";
import { mapCategory } from "@/lib/db/catalog";
import { prisma } from "@/lib/db/prisma";
import { slugify } from "@/lib/utils/format";
import {
  categoryUpdateSchema,
  uniqueSlug,
  zodErrorMessage,
} from "@/lib/catalog/validation";

type Params = { params: Promise<{ id: string }> };

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
    const parsed = categoryUpdateSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: zodErrorMessage(parsed.error, "Invalid category data") },
        { status: 400 },
      );
    }
    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    // Renaming keeps the slug (category URLs). Only an explicit slug changes it.
    const { slug: wantedSlug, ...rest } = parsed.data;
    let slug: string | undefined;
    if (wantedSlug !== undefined) {
      const wanted = slugify(wantedSlug || rest.name || existing.name);
      slug =
        wanted === existing.slug
          ? wanted
          : await uniqueSlug(wanted, async (candidate) =>
              Boolean(
                await prisma.category.findFirst({
                  where: { slug: candidate, NOT: { id } },
                  select: { id: true },
                }),
              ),
            );
    }
    const category = await prisma.category.update({
      where: { id },
      data: { ...rest, slug },
    });

    revalidatePath("/", "layout");
    revalidatePath("/shop");
    return NextResponse.json({ data: mapCategory(category) });
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
    const productCount = await prisma.product.count({ where: { categoryId: id } });
    if (productCount > 0) {
      return NextResponse.json(
        {
          error: `This category still has ${productCount} product(s). Move or delete them first.`,
        },
        { status: 409 },
      );
    }
    await prisma.category.deleteMany({ where: { id } });

    revalidatePath("/", "layout");
    revalidatePath("/shop");
    return NextResponse.json({ data: { ok: true } });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Delete failed" },
      { status: 500 },
    );
  }
}
