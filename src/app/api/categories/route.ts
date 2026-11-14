import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { USER_ROLES } from "@/constants/auth";
import { auth } from "@/lib/auth/auth";
import { mapCategories, mapCategory } from "@/lib/db/catalog";
import { prisma } from "@/lib/db/prisma";
import { slugify } from "@/lib/utils/format";

const schema = z.object({
  name: z.string().min(2),
  slug: z.string().optional(),
  description: z.string().optional(),
  image: z.string().optional(),
  badge: z.string().optional(),
  sortOrder: z.number().default(0),
  isActive: z.boolean().default(true),
});

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { sortOrder: "asc" },
    });
    return NextResponse.json({ data: mapCategories(categories) });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed" },
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
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const category = await prisma.category.create({
      data: {
        ...parsed.data,
        slug: parsed.data.slug || slugify(parsed.data.name),
      },
    });

    revalidatePath("/", "layout");
    revalidatePath("/shop");
    return NextResponse.json({ data: mapCategory(category) });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Create failed" },
      { status: 500 },
    );
  }
}
