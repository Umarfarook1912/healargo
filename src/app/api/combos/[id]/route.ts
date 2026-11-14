import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { mapCombo } from "@/lib/db/catalog";
import { prisma } from "@/lib/db/prisma";
import { isDbId } from "@/lib/db/serialize";
import { slugify, stripHtml } from "@/lib/utils/format";

type Params = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: Params) {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.response;
  const { id } = await params;
  const body = await request.json();
  if (body.name) {
    const rawSlug = slugify(stripHtml(body.name));
    if (rawSlug) body.slug = rawSlug;
  }
  if (body.startsAt !== undefined) {
    const d = body.startsAt ? new Date(body.startsAt) : null;
    body.startsAt = d && !Number.isNaN(d.getTime()) ? d : null;
  }
  if (body.endsAt !== undefined) {
    const d = body.endsAt ? new Date(body.endsAt) : null;
    body.endsAt = d && !Number.isNaN(d.getTime()) ? d : null;
  }
  if (!isDbId(id)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const existing = await prisma.combo.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const combo = await prisma.combo.update({ where: { id }, data: body });
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
