import { ROUTES } from "@/constants/routes";

/**
 * Turns a `callbackUrl` (relative path or absolute same-origin URL, as set by
 * the NextAuth middleware) into a safe in-app path. Anything pointing at
 * another origin, protocol-relative URLs and auth pages fall back to null.
 */
export function safeCallbackPath(
  callbackUrl: string | null | undefined,
  origin?: string,
): string | null {
  const raw = callbackUrl?.trim();
  if (!raw) return null;

  if (raw.startsWith("/")) {
    if (raw.startsWith("//") || raw.startsWith("/\\")) return null;
    return isAuthPath(raw) ? null : raw;
  }

  if (!origin) return null;
  try {
    const url = new URL(raw);
    const base = new URL(origin);
    if (url.origin !== base.origin) return null;
    const path = `${url.pathname}${url.search}${url.hash}`;
    return isAuthPath(path) ? null : path;
  } catch {
    return null;
  }
}

function isAuthPath(path: string): boolean {
  return (
    path === ROUTES.LOGIN ||
    path.startsWith(`${ROUTES.LOGIN}/`) ||
    path.startsWith(`${ROUTES.LOGIN}?`) ||
    path === ROUTES.REGISTER ||
    path.startsWith(`${ROUTES.REGISTER}?`)
  );
}

export function getPostLoginRoute(
  callbackUrl?: string | null,
  origin?: string,
) {
  return safeCallbackPath(callbackUrl, origin) ?? ROUTES.HOME;
}

export function getPostLogoutRoute() {
  return ROUTES.LOGIN;
}
