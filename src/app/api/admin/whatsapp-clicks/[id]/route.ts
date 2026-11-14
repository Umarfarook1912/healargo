import { NextResponse } from "next/server";
import { z } from "zod";
import {
  WHATSAPP_LEAD_COPY,
  WHATSAPP_LEAD_STATUSES,
} from "@/constants/whatsapp-leads";
import { requireAdmin } from "@/lib/auth/require-admin";
import { prisma } from "@/lib/db/prisma";
import { isDbId, withId } from "@/lib/db/serialize";

const patchSchema = z.object({
  status: z.enum(WHATSAPP_LEAD_STATUSES),
});

type Props = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Props) {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.response;

  try {
    const { id } = await params;
    if (!isDbId(id)) {
      return NextResponse.json(
        { error: WHATSAPP_LEAD_COPY.notFound },
        { status: 404 },
      );
    }
    const parsed = patchSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: WHATSAPP_LEAD_COPY.invalidClick },
        { status: 400 },
      );
    }

    const existing = await prisma.whatsAppClick.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: WHATSAPP_LEAD_COPY.notFound },
        { status: 404 },
      );
    }

    const lead = await prisma.whatsAppClick.update({
      where: { id },
      data: { status: parsed.data.status },
    });

    return NextResponse.json({ data: withId(lead) });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : WHATSAPP_LEAD_COPY.updateFailed,
      },
      { status: 500 },
    );
  }
}
