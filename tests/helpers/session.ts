/**
 * API tests call route handlers in-process. `@/lib/auth/auth` is mocked in
 * tests/setup/api.ts so `auth()` returns whatever session `actAs` set.
 * Admin checks still re-read the role from the database (isAdminSession).
 */
type SessionUser = { id: string; email: string; name?: string | null; role: string };

const g = globalThis as typeof globalThis & { __hgSession?: unknown };

export function actAs(user: SessionUser | null, overrides: { role?: string } = {}) {
  g.__hgSession = user
    ? {
        user: {
          id: user.id,
          email: user.email,
          name: user.name ?? "Test",
          role: overrides.role ?? user.role,
        },
        expires: new Date(Date.now() + 3600_000).toISOString(),
      }
    : null;
}

export function currentSession() {
  return g.__hgSession ?? null;
}
