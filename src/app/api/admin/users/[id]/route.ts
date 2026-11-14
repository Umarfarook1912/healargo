import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { AUTH, AUTH_ERRORS, USER_ROLES } from "@/constants/auth";
import { requireAdmin } from "@/lib/auth/require-admin";
import { adminUpdateUserSchema } from "@/lib/auth/schemas";
import { mapAdminUser } from "@/lib/db/users";
import { prisma } from "@/lib/db/prisma";
import { isDbId } from "@/lib/db/serialize";

type Params = { params: Promise<{ id: string }> };

async function guardTarget(adminId: string, targetId: string) {
  if (targetId === adminId) {
    return NextResponse.json(
      { error: AUTH_ERRORS.cannotDeleteSelf },
      { status: 400 },
    );
  }
  return null;
}

export async function PUT(request: Request, { params }: Params) {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.response;

  try {
    const { id } = await params;
    if (!isDbId(id)) {
      return NextResponse.json(
        { error: AUTH_ERRORS.userNotFound },
        { status: 404 },
      );
    }
    const parsed = adminUpdateUserSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: AUTH_ERRORS.invalidInput },
        { status: 400 },
      );
    }

    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) {
      return NextResponse.json(
        { error: AUTH_ERRORS.userNotFound },
        { status: 404 },
      );
    }

    if (
      parsed.data.role &&
      parsed.data.role !== target.role &&
      id === admin.session.user.id
    ) {
      return NextResponse.json(
        { error: AUTH_ERRORS.cannotChangeOwnRole },
        { status: 400 },
      );
    }

    if (
      target.role === USER_ROLES.ADMIN &&
      parsed.data.role === USER_ROLES.USER
    ) {
      const adminCount = await prisma.user.count({
        where: { role: USER_ROLES.ADMIN },
      });
      if (adminCount <= 1) {
        return NextResponse.json(
          { error: AUTH_ERRORS.lastAdmin },
          { status: 400 },
        );
      }
    }

    if (parsed.data.email) {
      const email = parsed.data.email.toLowerCase();
      const exists = await prisma.user.findFirst({
        where: { email, NOT: { id: target.id } },
      });
      if (exists) {
        return NextResponse.json(
          { error: AUTH_ERRORS.emailTaken },
          { status: 409 },
        );
      }
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        ...(parsed.data.email
          ? { email: parsed.data.email.toLowerCase() }
          : {}),
        ...(parsed.data.name ? { name: parsed.data.name } : {}),
        ...(parsed.data.phone !== undefined ? { phone: parsed.data.phone } : {}),
        ...(parsed.data.role ? { role: parsed.data.role } : {}),
        ...(parsed.data.password
          ? {
              passwordHash: await bcrypt.hash(
                parsed.data.password,
                AUTH.bcryptRounds,
              ),
            }
          : {}),
      },
    });

    return NextResponse.json({
      data: mapAdminUser(updated),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : AUTH_ERRORS.updateFailed,
      },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.response;

  try {
    const { id } = await params;
    const blocked = await guardTarget(admin.session.user.id, id);
    if (blocked) return blocked;

    if (!isDbId(id)) {
      return NextResponse.json(
        { error: AUTH_ERRORS.userNotFound },
        { status: 404 },
      );
    }

    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) {
      return NextResponse.json(
        { error: AUTH_ERRORS.userNotFound },
        { status: 404 },
      );
    }

    if (target.role === USER_ROLES.ADMIN) {
      const adminCount = await prisma.user.count({
        where: { role: USER_ROLES.ADMIN },
      });
      if (adminCount <= 1) {
        return NextResponse.json(
          { error: AUTH_ERRORS.cannotDeleteLastAdmin },
          { status: 400 },
        );
      }
    }

    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ data: { ok: true } });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : AUTH_ERRORS.updateFailed,
      },
      { status: 500 },
    );
  }
}
