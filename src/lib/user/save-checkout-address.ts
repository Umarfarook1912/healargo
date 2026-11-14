import type { Prisma } from "@prisma/client";
import type { ShippingAddress } from "@/types/user";
import { prisma } from "@/lib/db/prisma";
import { readUserAddresses } from "@/lib/db/users";
import { isSameShippingAddress, toSavedAddress } from "@/lib/user/addresses";

export async function saveCheckoutAddressForUser(
  userId: string,
  address: ShippingAddress,
): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { addresses: true },
  });
  if (!user) return;

  const addresses = readUserAddresses(user.addresses);
  const existingIndex = addresses.findIndex((saved) =>
    isSameShippingAddress(saved, address),
  );

  if (existingIndex >= 0) {
    const previous = addresses[existingIndex];
    addresses[existingIndex] = toSavedAddress(
      address,
      Boolean(previous?.isDefault) || addresses.length === 1,
    );
  } else {
    const isFirst = addresses.length === 0;
    if (isFirst) {
      addresses.forEach((addr) => {
        addr.isDefault = false;
      });
    }
    addresses.push(toSavedAddress(address, isFirst));
  }

  await prisma.user.update({
    where: { id: userId },
    data: { addresses: addresses as unknown as Prisma.InputJsonValue },
  });
}
