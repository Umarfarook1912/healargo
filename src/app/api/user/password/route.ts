import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { AUTH, AUTH_ERRORS } from "@/constants/auth";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";

const schema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(AUTH.passwordMinLength),
});

export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: AUTH_ERRORS.unauthorized }, { status: 401 });
  }

  try {
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: AUTH_ERRORS.invalidInput }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, passwordHash: true },
    });
    if (!user?.passwordHash) {
      return NextResponse.json(
        { error: "Password change is only available for email accounts" },
        { status: 400 },
      );
    }

    const valid = await bcrypt.compare(
      parsed.data.currentPassword,
      user.passwordHash,
    );
    if (!valid) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        passwordHash: await bcrypt.hash(parsed.data.newPassword, AUTH.bcryptRounds),
      },
    });

    return NextResponse.json({ data: { ok: true } });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed" },
      { status: 500 },
    );
  }
}
