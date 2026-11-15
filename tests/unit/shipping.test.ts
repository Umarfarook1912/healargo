import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({
  orders: [] as Array<{ id: string; trackingNumber: string | null }>,
  findMany: vi.fn(),
  findUnique: vi.fn(),
  update: vi.fn(),
}));
vi.mock("@/lib/db/prisma", () => ({
  prisma: { order: { findMany: db.findMany, findUnique: db.findUnique, update: db.update } },
}));
const st = vi.hoisted(() => ({ fetch: vi.fn() }));
vi.mock("@/lib/shipping/st-courier", async (orig) => {
  const real = await orig<typeof import("@/lib/shipping/st-courier")>();
  return { ...real, fetchStCourierTracking: st.fetch };
});

import { normalizeConsignment, parseStCourierResultPage } from "@/lib/shipping/st-courier";
import { syncShippedOrders } from "@/lib/shipping/sync-tracking";
import { GET as cron } from "@/app/api/cron/tracking-sync/route";
import { stCourierResultHtml } from "../helpers/fake-services";

describe("ST Courier parsing", () => {
  it("TRK-007 parses summary, events and delivered", () => {
    const html = stCourierResultHtml({
      awb: "58240292331",
      status: "Delivered",
      events: [
        { date: "12-11-2026", time: "11:00", status: "Delivered", location: "COIMBATORE" },
        { date: "10-11-2026", time: "18:00", status: "Booked", location: "CHENNAI -to- COIMBATORE" },
      ],
    });
    const parsed = parseStCourierResultPage(html, "58240292331")!;
    expect(parsed.delivered).toBe(true);
    expect(parsed.summary).toMatchObject({ currentStatus: "Delivered", origin: "CHENNAI", destination: "COIMBATORE", consignment: "58240292331" });
    expect(parsed.events).toHaveLength(2);
    expect(parsed.events[1].location).toBe("CHENNAI -> COIMBATORE");
    expect(parsed.raw.length).toBeLessThanOrEqual(1000);
    expect(parseStCourierResultPage(stCourierResultHtml({ awb: "1", status: "Out for delivery" }), "1")!.delivered).toBe(false);
    expect(parseStCourierResultPage("<html><body>nothing</body></html>", "1")).toBeNull();
  });

  it("TRK-008 normalizeConsignment", () => {
    expect(normalizeConsignment("58240292331")).toBe("58240292331");
    expect(normalizeConsignment(" 58240292331 ")).toBe("58240292331");
    expect(normalizeConsignment("5824029233")).toBeNull();
    expect(normalizeConsignment("5824029233a")).toBeNull();
    expect(normalizeConsignment(123)).toBeNull();
  });
});

describe("tracking sync batch (mocked database)", () => {
  beforeEach(() => {
    db.findMany.mockReset();
    db.findUnique.mockReset();
    db.update.mockReset();
    st.fetch.mockReset();
  });

  it("CRN-003 never-checked shipments come first, 50 per run", async () => {
    db.findMany.mockResolvedValue([]);
    await syncShippedOrders(undefined, { delayMs: 0 });
    const args = db.findMany.mock.calls[0][0];
    expect(args.take).toBe(50);
    expect(args.where).toMatchObject({ status: "SHIPPED", trackingNumber: { not: null } });
    expect(args.orderBy[0]).toEqual({ trackingLastCheckedAt: { sort: "asc", nulls: "first" } });
  });

  it("CRN-002 + CRN-004 counts results and survives one failure", async () => {
    const orders = [
      { id: "o1", trackingNumber: "11111111111", status: "SHIPPED" },
      { id: "o2", trackingNumber: "22222222222", status: "SHIPPED" },
      { id: "o3", trackingNumber: "33333333333", status: "SHIPPED" },
    ];
    db.findMany.mockResolvedValue(orders.map(({ id, trackingNumber }) => ({ id, trackingNumber })));
    db.findUnique.mockImplementation(async ({ where }: { where: { id: string } }) => orders.find((o) => o.id === where.id));
    db.update.mockResolvedValue({});
    st.fetch.mockImplementation(async (awb: string) => {
      if (awb === "11111111111") return { trackingNumber: awb, status: "Delivered", delivered: true, raw: "", summary: {}, events: [] };
      if (awb === "22222222222") throw new Error("boom");
      return { trackingNumber: awb, status: "In Transit", delivered: false, raw: "", summary: {}, events: [] };
    });
    const summary = await syncShippedOrders(undefined, { delayMs: 0 });
    expect(summary).toMatchObject({ checked: 3, updated: 2, delivered: 1 });
    expect(summary.results.find((r) => r.orderId === "o2")!.ok).toBe(false);
    const deliveredUpdate = db.update.mock.calls.find((c) => c[0].where.id === "o1")![0];
    expect(deliveredUpdate.data.status).toBe("DELIVERED");
  });
});

describe("cron route", () => {
  const get = (auth?: string) =>
    cron(new Request("http://x/api/cron/tracking-sync", { headers: auth ? { authorization: auth } : {} }));

  it("CRN-001 an unset secret never allows access", async () => {
    const saved = process.env.CRON_SECRET;
    delete process.env.CRON_SECRET;
    for (const h of [undefined, "Bearer wrong", "Bearer ", "Bearer undefined"]) {
      expect((await get(h)).status).toBe(401);
    }
    process.env.CRON_SECRET = "s3cret";
    expect((await get("Bearer wrong")).status).toBe(401);
    db.findMany.mockResolvedValue([]);
    const ok = await get("Bearer s3cret");
    expect(ok.status).toBe(200);
    expect((await ok.json()).data).toMatchObject({ checked: 0 });
    process.env.CRON_SECRET = saved;
  });
});
