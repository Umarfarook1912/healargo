import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { phoneSchema, pincodeSchema } from "@/lib/validation/address";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { readUserAddresses } from "@/lib/db/users";

const addressSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  phone: phoneSchema("Valid phone number is required"),
  email: z.string().email().optional().or(z.literal("")),
  line1: z.string().min(3, "Address line 1 is required"),
  line2: z.string().optional().or(z.literal("")),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  pincode: pincodeSchema("Valid pincode is required"),
  country: z.string().default("India"),
  isDefault: z.boolean().optional(),
});

function clearOtherDefaults(
  addresses: Array<{ isDefault?: boolean }>,
  keepIndex: number,
) {
  addresses.forEach((addr, i) => {
    if (i !== keepIndex) addr.isDefault = false;
  });
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { addresses: true },
    });
    return NextResponse.json({ data: readUserAddresses(user?.addresses) });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch addresses" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = addressSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { addresses: true },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const addresses = readUserAddresses(user.addresses);
    const next = { ...parsed.data, isDefault: Boolean(parsed.data.isDefault) };
    if (next.isDefault || addresses.length === 0) {
      clearOtherDefaults(addresses, -1);
      next.isDefault = true;
    }
    addresses.push(next);
    await prisma.user.update({
      where: { id: session.user.id },
      data: { addresses: addresses as unknown as Prisma.InputJsonValue },
    });

    return NextResponse.json({
      message: "Address added successfully",
      data: addresses,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to add address" },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { index, ...addressData } = body;

    if (typeof index !== "number" || index < 0) {
      return NextResponse.json({ error: "Invalid address index" }, { status: 400 });
    }

    const parsed = addressSchema.safeParse(addressData);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { addresses: true },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const addresses = readUserAddresses(user.addresses);
    if (index >= addresses.length) {
      return NextResponse.json({ error: "Address index out of bounds" }, { status: 400 });
    }

    const next = { ...parsed.data, isDefault: Boolean(parsed.data.isDefault) };
    addresses[index] = next;
    if (next.isDefault) {
      clearOtherDefaults(addresses, index);
      addresses[index].isDefault = true;
    }
    await prisma.user.update({
      where: { id: session.user.id },
      data: { addresses: addresses as unknown as Prisma.InputJsonValue },
    });

    return NextResponse.json({
      message: "Address updated successfully",
      data: addresses,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update address" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const indexStr = searchParams.get("index");
    const index = indexStr ? parseInt(indexStr, 10) : -1;

    if (index < 0 || isNaN(index)) {
      return NextResponse.json({ error: "Invalid address index" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { addresses: true },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const addresses = readUserAddresses(user.addresses);
    if (index >= addresses.length) {
      return NextResponse.json({ error: "Address index out of bounds" }, { status: 400 });
    }

    const wasDefault = addresses[index]?.isDefault;
    addresses.splice(index, 1);
    if (wasDefault && addresses[0]) {
      addresses[0].isDefault = true;
    }
    await prisma.user.update({
      where: { id: session.user.id },
      data: { addresses: addresses as unknown as Prisma.InputJsonValue },
    });

    return NextResponse.json({
      message: "Address removed successfully",
      data: addresses,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete address" },
      { status: 500 },
    );
  }
}
