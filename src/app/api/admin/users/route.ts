import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { AUTH, AUTH_ERRORS, USER_ROLES } from "@/constants/auth";
import { requireAdmin } from "@/lib/auth/require-admin";
import {
  adminCreateUserSchema,
  adminUpdateRoleSchema,
} from "@/lib/auth/schemas";
import { mapAdminUser, mapAdminUsers } from "@/lib/db/users";
import { prisma } from "@/lib/db/prisma";
import { isDbId } from "@/lib/db/serialize";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.response;

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ data: mapAdminUsers(users) });
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.response;

  try {
    const parsed = adminCreateUserSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: AUTH_ERRORS.invalidInput },
        { status: 400 },
      );
    }

    const email = parsed.data.email.toLowerCase();
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
      return NextResponse.json(
        { error: AUTH_ERRORS.emailTaken },
        { status: 409 },
      );
    }

    const passwordHash = await bcrypt.hash(
      parsed.data.password,
      AUTH.bcryptRounds,
    );
    const user = await prisma.user.create({
      data: {
        name: parsed.data.name,
        email,
        passwordHash,
        phone: parsed.data.phone,
        role: parsed.data.role ?? USER_ROLES.USER,
      },
    });

    return NextResponse.json({
      data: mapAdminUser(user),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : AUTH_ERRORS.createFailed,
      },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.response;

  try {
    const parsed = adminUpdateRoleSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: AUTH_ERRORS.invalidInput },
        { status: 400 },
      );
    }

    if (parsed.data.id === admin.session.user.id) {
      return NextResponse.json(
        { error: AUTH_ERRORS.cannotChangeOwnRole },
        { status: 400 },
      );
    }

    if (!isDbId(parsed.data.id)) {
      return NextResponse.json(
        { error: AUTH_ERRORS.userNotFound },
        { status: 404 },
      );
    }

    const target = await prisma.user.findUnique({
      where: { id: parsed.data.id },
    });
    if (!target) {
      return NextResponse.json(
        { error: AUTH_ERRORS.userNotFound },
        { status: 404 },
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

    const updated = await prisma.user.update({
      where: { id: target.id },
      data: { role: parsed.data.role },
    });

    return NextResponse.json({
      data: { id: updated.id, role: updated.role },
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
