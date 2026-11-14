import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { USER_ROLES } from "@/constants/auth";
import { auth } from "@/lib/auth/auth";
import { mapCarousel } from "@/lib/db/catalog";
import { prisma } from "@/lib/db/prisma";
import { isDbId } from "@/lib/db/serialize";
import { carouselSchema } from "@/lib/carousels/validation";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user || session.user.role !== USER_ROLES.ADMIN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    if (!isDbId(id)) {
      return NextResponse.json({ error: "Invalid slide ID" }, { status: 400 });
    }

    const slide = await prisma.carousel.findUnique({ where: { id } });
    if (!slide) {
      return NextResponse.json({ error: "Slide not found" }, { status: 404 });
    }

    return NextResponse.json({ data: mapCarousel(slide) });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch slide" },
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
    if (!isDbId(id)) {
      return NextResponse.json({ error: "Invalid slide ID" }, { status: 400 });
    }

    const body = await request.json();
    const parsed = carouselSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const existing = await prisma.carousel.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Slide not found" }, { status: 404 });
    }
    const slide = await prisma.carousel.update({
      where: { id },
      data: parsed.data,
    });

    revalidatePath("/", "layout");
    revalidatePath("/admin/carousels");

    return NextResponse.json({ data: mapCarousel(slide) });
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
      return NextResponse.json({ error: "Invalid slide ID" }, { status: 400 });
    }

    await prisma.carousel.deleteMany({ where: { id } });

    revalidatePath("/", "layout");
    revalidatePath("/admin/carousels");

    return NextResponse.json({ data: { ok: true } });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Delete failed" },
      { status: 500 },
    );
  }
}
