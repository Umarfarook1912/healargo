import { beforeAll, describe, expect, it, vi } from "vitest";

const ph = vi.hoisted(() => ({ capture: vi.fn() }));
vi.mock("@/lib/analytics/posthog", () => ({ capturePostHogEvent: ph.capture }));

describe("ANL-013 trackPurchase dedupe", () => {
  beforeAll(() => {
    const g = globalThis as Record<string, unknown>;
    g.window = globalThis;
    const store = new Map<string, string>();
    g.sessionStorage = { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v) };
  });

  it("sends one purchase per order and ignores bad input", async () => {
    const { trackPurchase } = await import("@/lib/analytics/purchase");
    const gtag = vi.fn();
    (globalThis as Record<string, unknown>).gtag = gtag;
    const purchase = { orderId: "ORD1", value: 700, items: [{ itemId: "p", itemName: "Oil", price: 350, quantity: 2 }] };
    trackPurchase(purchase);
    trackPurchase(purchase);
    trackPurchase({ ...purchase, orderId: "ORD2", value: Number.NaN });
    trackPurchase({ ...purchase, orderId: "  " });
    expect(gtag.mock.calls.filter((c) => c[1] === "purchase")).toHaveLength(1);
    expect(ph.capture.mock.calls.filter((c) => c[0] === "order_completed")).toHaveLength(1);
  });
});
