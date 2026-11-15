import { describe, expect, it } from "vitest";
import { calculatePricing } from "@/lib/orders/pricing";

describe("pricing", () => {
  it("keeps GST inside the product price and shipping free", () => {
    const pricing = calculatePricing(100, 0);
    expect(pricing.shipping).toBe(0);
    expect(pricing.tax).toBe(0);
    expect(pricing.total).toBe(100);
  });

  it("does not add GST or shipping on a one-rupee order", () => {
    const pricing = calculatePricing(1, 0, {
      taxableSubtotal: 0,
      waiveShipping: true,
    });
    expect(pricing.tax).toBe(0);
    expect(pricing.shipping).toBe(0);
    expect(pricing.total).toBe(1);
  });
});
