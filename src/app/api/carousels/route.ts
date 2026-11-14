import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { USER_ROLES } from "@/constants/auth";
import { auth } from "@/lib/auth/auth";
import { mapCarousel, mapCarousels } from "@/lib/db/catalog";
import { prisma } from "@/lib/db/prisma";
import { carouselSchema } from "@/lib/carousels/validation";

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== USER_ROLES.ADMIN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const slides = await prisma.carousel.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });
    return NextResponse.json({ data: mapCarousels(slides) });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch carousels" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== USER_ROLES.ADMIN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = carouselSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const slide = await prisma.carousel.create({ data: parsed.data });

    revalidatePath("/", "layout");
    revalidatePath("/admin/carousels");

    return NextResponse.json(
      { data: mapCarousel(slide) },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create carousel slide" },
      { status: 500 },
    );
  }
}
