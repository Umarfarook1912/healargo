import type { startFakeServices } from "./fake-services";

type Fake = Awaited<ReturnType<typeof startFakeServices>>;

/** The fake services started by tests/setup/api.ts for the current file. */
export function fake(): Fake {
  const handle = (globalThis as typeof globalThis & { __hgFake?: Fake }).__hgFake;
  if (!handle) throw new Error("fake services not started (is tests/setup/api.ts loaded?)");
  return handle;
}
