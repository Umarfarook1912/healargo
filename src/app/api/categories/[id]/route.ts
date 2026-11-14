import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth/auth";
import { isDbId } from "@/lib/db/serialize";
import { mapCategory } from "@/lib/db/catalog";
import { prisma } from "@/lib/db/prisma";
import { slugify } from "@/lib/utils/format";
import { USER_ROLES } from "@/constants/auth";

type Params = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user || session.user.role !== USER_ROLES.ADMIN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    if (!isDbId(id)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }
    const body = await request.json();
    if (body.name && !body.slug) body.slug = slugify(body.name);
    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const category = await prisma.category.update({
      where: { id },
      data: body,
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
  if (!session?.user || session.user.role !== USER_ROLES.ADMIN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    if (!isDbId(id)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
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
