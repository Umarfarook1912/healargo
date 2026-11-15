"use client";

import { SessionProvider } from "next-auth/react";

/**
 * The root not-found page renders the full storefront chrome (Header uses
 * `useSession`). Next.js can render `app/not-found.tsx` for unmatched URLs in a
 * separate client bundle from the root layout's <Providers>; when that happens
 * the session context from the layout is not visible to Header and the render
 * throws. A local SessionProvider guarantees Header always has a session
 * context on the 404 page. Nesting inside the layout's provider is harmless.
 */
export function NotFoundSessionBoundary({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
