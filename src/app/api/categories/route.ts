import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth/auth";
import { isAdminSession } from "@/lib/auth/require-admin";
import { mapCategories, mapCategory } from "@/lib/db/catalog";
import { prisma } from "@/lib/db/prisma";
import { slugify } from "@/lib/utils/format";
import {
  categorySchema,
  uniqueSlug,
  zodErrorMessage,
} from "@/lib/catalog/validation";

export async function GET() {
  try {
    // Inactive categories are only listed for admins.
    const isAdmin = await isAdminSession(await auth());
    const categories = await prisma.category.findMany({
      where: isAdmin ? undefined : { isActive: true },
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
  if (!session?.user || !(await isAdminSession(session))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = categorySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: zodErrorMessage(parsed.error, "Invalid category data") },
        { status: 400 },
      );
    }
    const slug = await uniqueSlug(
      slugify(parsed.data.slug || parsed.data.name),
      async (candidate) =>
        Boolean(
          await prisma.category.findUnique({
            where: { slug: candidate },
            select: { id: true },
          }),
        ),
    );
    const category = await prisma.category.create({
      data: {
        ...parsed.data,
        slug,
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
