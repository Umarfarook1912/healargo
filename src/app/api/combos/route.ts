import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { isAdminSession, requireAdmin } from "@/lib/auth/require-admin";
import {
  comboSchema,
  parseOptionalDate,
  uniqueSlug,
  zodErrorMessage,
} from "@/lib/catalog/validation";
import { mapCombo, mapCombos } from "@/lib/db/catalog";
import { prisma } from "@/lib/db/prisma";
import { slugify, stripHtml } from "@/lib/utils/format";

export async function GET() {
  // Inactive combos are only listed for admins.
  const isAdmin = await isAdminSession(await auth());
  const combos = await prisma.combo.findMany({
    where: isAdmin ? undefined : { isActive: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ data: mapCombos(combos) });
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.response;
  const body = await request.json();
  const parsed = comboSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: zodErrorMessage(parsed.error, "Invalid combo data") },
      { status: 400 },
    );
  }
  try {
    const rawSlug = slugify(stripHtml(parsed.data.name));
    const slug = await uniqueSlug(rawSlug || `combo-${Date.now()}`, async (candidate) =>
      Boolean(
        await prisma.combo.findUnique({ where: { slug: candidate }, select: { id: true } }),
      ),
    );
    const combo = await prisma.combo.create({
      data: {
        ...parsed.data,
        slug,
        startsAt: parseOptionalDate(parsed.data.startsAt),
        endsAt: parseOptionalDate(parsed.data.endsAt),
      },
    });
    return NextResponse.json({ data: mapCombo(combo) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save combo";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

