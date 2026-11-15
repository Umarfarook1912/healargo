/**
 * Safety checks for `npm run seed`, which DELETES every user, order, product,
 * category, review and WhatsApp lead before inserting demo data.
 */
export const SEED_CONFIRM_FLAG = "--confirm-wipe";
export const SEED_ADMIN_PASSWORD_MIN = 10;

export type SeedConfig = {
  adminEmail: string;
  adminPassword: string;
};

export function checkSeedAllowed(
  env: Record<string, string | undefined>,
  argv: string[],
): { ok: true; config: SeedConfig } | { ok: false; error: string } {
  if (env.NODE_ENV === "production" || env.VERCEL_ENV === "production") {
    return { ok: false, error: "Refusing to seed: NODE_ENV/VERCEL_ENV is production." };
  }
  if (!argv.includes(SEED_CONFIRM_FLAG) && env.SEED_CONFIRM !== "wipe") {
    return {
      ok: false,
      error:
        `Refusing to seed: this wipes users, orders and products. ` +
        `Re-run with "npm run seed -- ${SEED_CONFIRM_FLAG}" (or SEED_CONFIRM=wipe) ` +
        `against a database you really want to reset.`,
    };
  }
  const adminPassword = env.SEED_ADMIN_PASSWORD ?? "";
  if (adminPassword.length < SEED_ADMIN_PASSWORD_MIN) {
    return {
      ok: false,
      error: `Set SEED_ADMIN_PASSWORD (at least ${SEED_ADMIN_PASSWORD_MIN} characters) for the starter admin.`,
    };
  }
  const adminEmail = (env.SEED_ADMIN_EMAIL ?? "healargo@gmail.com").trim().toLowerCase();
  return { ok: true, config: { adminEmail, adminPassword } };
}
