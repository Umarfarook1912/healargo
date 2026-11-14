import { NextResponse } from "next/server";
import { AUTH_ERRORS } from "@/constants/auth";
import { requireAdmin } from "@/lib/auth/require-admin";
import { prisma } from "@/lib/db/prisma";
import { isDbId } from "@/lib/db/serialize";
import { normalizeConsignment, ST_COURIER_NAME } from "@/lib/shipping/st-courier";
import { OrderStatus, PaymentStatus } from "@/types/order";

type Params = { params: Promise<{ id: string }> };

const PRE_SHIPPED_STATUSES: string[] = [
  OrderStatus.PENDING,
  OrderStatus.CONFIRMED,
  OrderStatus.PROCESSING,
];

function trackingPayload(order: {
  id: string;
  status?: string;
  trackingNumber?: string | null;
  courier?: string | null;
  trackingStatus?: string | null;
  trackingLastCheckedAt?: Date | null;
  shippedAt?: Date | null;
}) {
  return {
    id: order.id,
    status: order.status,
    trackingNumber: order.trackingNumber ?? null,
    courier: order.courier ?? null,
    trackingStatus: order.trackingStatus ?? null,
    trackingLastCheckedAt: order.trackingLastCheckedAt ?? null,
    shippedAt: order.shippedAt ?? null,
  };
}

function errorResponse(error: unknown) {
  return NextResponse.json(
    { error: error instanceof Error ? error.message : AUTH_ERRORS.updateFailed },
    { status: 500 },
  );
}

export async function GET(_request: Request, { params }: Params) {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.response;

  try {
    const { id } = await params;
    if (!isDbId(id)) {
      return NextResponse.json({ error: AUTH_ERRORS.notFound }, { status: 404 });
    }
    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) {
      return NextResponse.json({ error: AUTH_ERRORS.notFound }, { status: 404 });
    }
    return NextResponse.json({ data: trackingPayload(order) });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT(request: Request, { params }: Params) {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.response;

  try {
    const { id } = await params;
    if (!isDbId(id)) {
      return NextResponse.json({ error: AUTH_ERRORS.notFound }, { status: 404 });
    }
    const body = (await request.json().catch(() => ({}))) as { trackingNumber?: unknown };
    const trackingNumber = normalizeConsignment(body.trackingNumber);
    if (!trackingNumber) {
      return NextResponse.json(
        { error: "Consignment number must be exactly 11 digits" },
        { status: 400 },
      );
    }

    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) {
      return NextResponse.json({ error: AUTH_ERRORS.notFound }, { status: 404 });
    }
    if (order.paymentStatus !== PaymentStatus.PAID) {
      return NextResponse.json(
        { error: "Tracking can be added only for paid orders" },
        { status: 400 },
      );
    }

    const duplicate = await prisma.order.findFirst({
      where: {
        trackingNumber,
        NOT: { id: order.id },
      },
      select: { id: true },
    });
    if (duplicate) {
      return NextResponse.json(
        { error: "This consignment number is already used on another order" },
        { status: 409 },
      );
    }

    const changed = order.trackingNumber !== trackingNumber;
    const shouldShip = PRE_SHIPPED_STATUSES.includes(order.status);
    const updated = await prisma.order.update({
      where: { id },
      data: {
        trackingNumber,
        courier: ST_COURIER_NAME,
        ...(changed
          ? { trackingStatus: null, trackingLastCheckedAt: null }
          : {}),
        trackingUpdatedAt: new Date(),
        ...(shouldShip
          ? { status: OrderStatus.SHIPPED, shippedAt: new Date() }
          : {}),
      },
    });

    return NextResponse.json({ data: trackingPayload(updated) });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.response;

  try {
    const { id } = await params;
    if (!isDbId(id)) {
      return NextResponse.json({ error: AUTH_ERRORS.notFound }, { status: 404 });
    }
    const order = await prisma.order.update({
      where: { id },
      data: {
        trackingNumber: null,
        courier: null,
        trackingStatus: null,
        trackingLastCheckedAt: null,
        trackingUpdatedAt: new Date(),
      },
    }).catch(() => null);
    if (!order) {
      return NextResponse.json({ error: AUTH_ERRORS.notFound }, { status: 404 });
    }
    return NextResponse.json({ data: trackingPayload(order) });
  } catch (error) {
    return errorResponse(error);
  }
}
