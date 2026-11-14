import { NextResponse } from "next/server";
import { USER_ROLES } from "@/constants/auth";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { isDbId } from "@/lib/db/serialize";
import { ST_COURIER_NAME } from "@/lib/shipping/st-courier";
import {
  applyTrackingToOrder,
  getStCourierTrackingCached,
} from "@/lib/shipping/sync-tracking";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    if (!isDbId(id)) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const order = await prisma.order.findUnique({
      where: { id },
      select: {
        userId: true,
        status: true,
        trackingNumber: true,
        courier: true,
      },
    });
    if (!order) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const isAdmin = session.user.role === USER_ROLES.ADMIN;
    if (!isAdmin && String(order.userId ?? "") !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (!order.trackingNumber) {
      return NextResponse.json(
        { error: "This order has not been shipped yet" },
        { status: 404 },
      );
    }

    const result = await getStCourierTrackingCached(order.trackingNumber);
    if (!result) {
      return NextResponse.json(
        { error: "Couldn't load live status right now" },
        { status: 502 },
      );
    }

    if (!result.cached) {
      await applyTrackingToOrder(id, result.data, result.fetchedAt).catch(() => null);
    }

    return NextResponse.json({
      data: {
        trackingNumber: order.trackingNumber,
        courier: order.courier || ST_COURIER_NAME,
        status: result.data.status,
        delivered: result.data.delivered,
        summary: result.data.summary,
        events: result.data.events,
        fetchedAt: result.fetchedAt.toISOString(),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed" },
      { status: 500 },
    );
  }
}