import { Prisma } from "@prisma/client";
import {
  ATTRIBUTION_COPY,
  ATTRIBUTION_LIMITS,
  ATTRIBUTION_SOURCE,
} from "@/constants/attribution";
import { normalizeAttribution, sanitizeToken } from "@/lib/attribution/parse";
import { prisma } from "@/lib/db/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const visitSchema = z.object({
  sessionKey: z.string().trim().min(8).max(ATTRIBUTION_LIMITS.maxLength),
  source: z.string().max(ATTRIBUTION_LIMITS.maxLength).optional(),
  medium: z.string().max(ATTRIBUTION_LIMITS.maxLength).optional(),
  campaign: z.string().max(ATTRIBUTION_LIMITS.maxLength).optional(),
  content: z.string().max(ATTRIBUTION_LIMITS.maxLength).optional(),
  term: z.string().max(ATTRIBUTION_LIMITS.maxLength).optional(),
  landingPath: z.string().max(ATTRIBUTION_LIMITS.pathMaxLength).optional(),
});

export async function POST(request: Request) {
  try {
    const parsed = visitSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: ATTRIBUTION_COPY.invalidVisit }, { status: 400 });
    }

    const sessionKey = sanitizeToken(parsed.data.sessionKey);
    const attribution = normalizeAttribution(parsed.data);
    if (!sessionKey || !attribution) {
      return NextResponse.json({ error: ATTRIBUTION_COPY.invalidVisit }, { status: 400 });
    }

    const sessionVisits = await prisma.marketingVisit.count({ where: { sessionKey } });
    if (sessionVisits >= ATTRIBUTION_LIMITS.maxVisitsPerSession) {
      return NextResponse.json({ data: { ok: true } });
    }

    // A repeat of the same visit is expected (reloads, back button); skip it
    // in the database instead of raising (and logging) a unique-constraint error.
    await prisma.marketingVisit.createMany({
      skipDuplicates: true,
      data: {
        source: attribution.source ?? ATTRIBUTION_SOURCE.direct,
        medium: attribution.medium ?? "",
        campaign: attribution.campaign ?? "",
        content: attribution.content ?? "",
        term: attribution.term ?? "",
        landingPath: attribution.landingPath ?? "",
        sessionKey,
      },
    });
    return NextResponse.json({ data: { ok: true } });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json({ data: { ok: true } });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : ATTRIBUTION_COPY.visitFailed },
      { status: 500 },
    );
  }
}
