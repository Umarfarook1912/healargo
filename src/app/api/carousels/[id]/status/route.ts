import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth/auth";
import { isAdminSession } from "@/lib/auth/require-admin";
import { mapCarousel } from "@/lib/db/catalog";
import { prisma } from "@/lib/db/prisma";
import { isDbId } from "@/lib/db/serialize";

type Params = { params: Promise<{ id: string }> };

const statusSchema = z.object({
  isActive: z.boolean(),
});

export async function PATCH(request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user || !(await isAdminSession(session))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    if (!isDbId(id)) {
      return NextResponse.json({ error: "Invalid slide ID" }, { status: 400 });
    }

    const body = await request.json();
    const parsed = statusSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "isActive must be a boolean" },
        { status: 400 },
      );
    }

    const existing = await prisma.carousel.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "Slide not found" }, { status: 404 });
    }

    const slide = await prisma.carousel.update({
      where: { id },
      data: { isActive: parsed.data.isActive },
    });

    revalidatePath("/", "layout");
    revalidatePath("/admin/carousels");

    return NextResponse.json({ data: mapCarousel(slide) });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Status update failed" },
      { status: 500 },
    );
  }
}
