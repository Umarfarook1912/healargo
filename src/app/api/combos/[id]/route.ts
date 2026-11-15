import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { mapCombo } from "@/lib/db/catalog";
import { prisma } from "@/lib/db/prisma";
import { isDbId } from "@/lib/db/serialize";
import {
  comboUpdateSchema,
  parseOptionalDate,
  zodErrorMessage,
} from "@/lib/catalog/validation";

type Params = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: Params) {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.response;
  const { id } = await params;
  if (!isDbId(id)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const parsed = comboUpdateSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: zodErrorMessage(parsed.error, "Invalid combo data") },
      { status: 400 },
    );
  }
  const existing = await prisma.combo.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const { startsAt, endsAt, ...rest } = parsed.data;
  // Renaming keeps the slug so shared combo links keep working.
  const combo = await prisma.combo.update({
    where: { id },
    data: {
      ...rest,
      startsAt: startsAt === undefined ? undefined : parseOptionalDate(startsAt),
      endsAt: endsAt === undefined ? undefined : parseOptionalDate(endsAt),
    },
  });
  return NextResponse.json({ data: mapCombo(combo) });
}

export async function DELETE(_request: Request, { params }: Params) {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.response;
  const { id } = await params;
  if (!isDbId(id)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  await prisma.combo.deleteMany({ where: { id } });
  return NextResponse.json({ data: { ok: true } });
}
