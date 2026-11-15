/**
 * "Standard world" from TEST_PLAN 3.3, created fresh (with this run's marker)
 * by each API test file that needs it.
 */
import {
  createCategory,
  createCombo,
  createCoupon,
  createProduct,
  createUser,
} from "./factory";

export async function createStdWorld() {
  // Sequential on purpose: parallel creates open several connections at once,
  // which a remote database may refuse.
  const customerA = await createUser({ name: "Customer A" });
  const customerB = await createUser({ name: "Customer B" });
  const admin = await createUser({ role: "admin", name: "Admin" });
  const catOils = await createCategory({ name: "Oils", sortOrder: 901 });
  const catHidden = await createCategory({ isActive: false, sortOrder: 902 });

  const pSesame = await createProduct({
    categoryId: catOils.id,
    name: undefined,
    variants: [
      { label: "1L", price: 350, originalPrice: 400, stock: 10 },
      { label: "5L", price: 1600, originalPrice: 1800, stock: 0 },
      { label: "Toggle off", price: 200, originalPrice: 250, stock: 50, available: false },
    ],
    isBestSeller: true,
  });
  const [v1L, v5L, vToggleOff] = pSesame.variantIds;

  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  const pOffer = await createProduct({
    categoryId: catOils.id,
    variants: [{ label: "1L", price: 500, originalPrice: 550, offerPrice: 420, stock: 20 }],
    offer: { startsAt: new Date(now - day), endsAt: new Date(now + day) },
  });
  const pOfferExpired = await createProduct({
    categoryId: catOils.id,
    variants: [{ label: "1L", price: 500, originalPrice: 550, offerPrice: 420, stock: 20 }],
    offer: { startsAt: new Date(now - 3 * day), endsAt: new Date(now - day) },
  });
  const pInactive = await createProduct({ categoryId: catOils.id, isActive: false });

  const comboLive = await createCombo({
    items: [
      { productId: pSesame.id, variantId: v1L, quantity: 2, productName: "pSesame", variantLabel: "1L" },
      { isCustom: true, productName: "Gift box", customPrice: 50 },
    ],
    price: 600,
    originalPrice: 800,
  });
  const comboInactive = await createCombo({
    items: [{ productId: pSesame.id, variantId: v1L, quantity: 1 }],
    isActive: false,
  });
  const comboExpired = await createCombo({
    items: [{ productId: pSesame.id, variantId: v1L, quantity: 1 }],
    startsAt: new Date(now - 3 * day),
    endsAt: new Date(now - day),
  });

  const pct10 = await createCoupon({ discountType: "PERCENTAGE", discountValue: 10 });
  const flat100 = await createCoupon({ discountType: "FIXED", discountValue: 100 });

  return {
    customerA,
    customerB,
    admin,
    catOils,
    catHidden,
    pSesame,
    v1L,
    v5L,
    vToggleOff,
    pOffer,
    pOfferExpired,
    pInactive,
    comboLive,
    comboInactive,
    comboExpired,
    pct10,
    flat100,
  };
}

export type StdWorld = Awaited<ReturnType<typeof createStdWorld>>;
