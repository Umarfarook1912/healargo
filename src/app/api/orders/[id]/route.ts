import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { mapOrder } from "@/lib/db/orders";
import { prisma } from "@/lib/db/prisma";
import { isDbId } from "@/lib/db/serialize";
import { USER_ROLES } from "@/constants/auth";

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
      include: { items: true, user: true },
    });
    if (!order) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (order.userId !== session.user.id && session.user.role !== USER_ROLES.ADMIN) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ data: mapOrder(order) });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed" },
      { status: 500 },
    );
  }
}
