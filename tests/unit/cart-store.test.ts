import { beforeEach, describe, expect, it } from "vitest";
import { useCartStore } from "@/hooks/useCartStore";

const line = (o: Record<string, unknown> = {}) => ({
  productId: "p1",
  variantId: "v1",
  name: "Sesame Oil",
  variantLabel: "1L",
  price: 350,
  stock: 5,
  image: "",
  quantity: 1,
  ...o,
});
const s = () => useCartStore.getState();

beforeEach(() => s().clearCart());

describe("cart store", () => {
  it("CART-001 addItem merges lines and caps at stock", () => {
    s().addItem(line({ quantity: 4 }) as never);
    s().addItem(line({ quantity: 4 }) as never);
    expect(s().items).toHaveLength(1);
    expect(s().items[0].quantity).toBe(5);
  });

  it("CART-002 addItem refreshes price and stock", () => {
    s().addItem(line() as never);
    s().addItem(line({ price: 380, stock: 9 }) as never);
    expect(s().items[0]).toMatchObject({ price: 380, stock: 9, quantity: 2 });
  });

  it("CART-003 buyNowItem replaces the cart and clamps", () => {
    s().addItem(line({ productId: "other" }) as never);
    s().buyNowItem(line({ quantity: 0 }) as never);
    expect(s().items).toHaveLength(1);
    expect(s().items[0].quantity).toBe(1);
    s().buyNowItem(line({ quantity: 99 }) as never);
    expect(s().items[0].quantity).toBe(5);
  });

  it("CART-004 updateQuantity clamps", () => {
    s().addItem(line({ quantity: 2 }) as never);
    s().updateQuantity("p1", "v1", 0);
    expect(s().items[0].quantity).toBe(1);
    s().updateQuantity("p1", "v1", 10);
    expect(s().items[0].quantity).toBe(5);
  });

  it("CART-005 removeItem removes only that variant", () => {
    s().addItem(line() as never);
    s().addItem(line({ variantId: "v2" }) as never);
    s().removeItem("p1", "v1");
    expect(s().items.map((i) => i.variantId)).toEqual(["v2"]);
  });

  it("CART-006 subtotal and count", () => {
    s().addItem(line({ quantity: 2 }) as never);
    s().addItem(line({ productId: "p2", price: 100, quantity: 3 }) as never);
    expect(s().getSubtotal()).toBe(1000);
    expect(s().getItemCount()).toBe(5);
  });

  it("CART-012 syncProductFlags keeps state identity when unchanged", () => {
    s().addItem(line({ gstExempt: false }) as never);
    const before = s().items;
    s().syncProductFlags([{ productId: "p1", gstExempt: false }]);
    expect(s().items).toBe(before);
    s().syncProductFlags([{ productId: "p1", gstExempt: true }]);
    expect(s().items[0].gstExempt).toBe(true);
  });
});
