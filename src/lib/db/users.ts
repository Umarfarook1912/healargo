import type { User as PrismaUser } from "@prisma/client";
import { withId } from "@/lib/db/serialize";
import type { AdminUser, ShippingAddress, UserProfile } from "@/types/user";

export function readUserAddresses(addresses: unknown): ShippingAddress[] {
  return Array.isArray(addresses) ? (addresses as ShippingAddress[]) : [];
}

export function mapAdminUser(row: PrismaUser): AdminUser {
  return withId({
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone ?? undefined,
    image: row.image ?? undefined,
    role: row.role,
    createdAt: row.createdAt.toISOString(),
  });
}

export function mapAdminUsers(rows: PrismaUser[]): AdminUser[] {
  return rows.map(mapAdminUser);
}

export function mapUserProfile(row: PrismaUser): UserProfile {
  return withId({
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone ?? undefined,
    role: row.role,
    addresses: readUserAddresses(row.addresses),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  });
}
