/**
 * Cases from TEST_PLAN.md that are not automated yet. Each todo carries the
 * plan case ID, its level and priority, so `vitest` lists them as pending.
 * When you implement one, delete its line here and put the ID in the test name.
 */
import { describe, test } from "vitest";

describe("plan todo: E2E", () => {
  test.todo("AUTH-010 [P1] Google-only account cannot use password login");
  test.todo("AUTH-012 [P1] Register UI");
  test.todo("AUTH-013 [P1] Logout");
  test.todo("AUTH-018 [P2] Google button visibility");
  test.todo("AUTH-019 [P2] OAuth error toast");
  test.todo("AUTH-028 [P1] Forgot and reset journey");
  test.todo("AUTH-029 [P2] /login/complete");
  test.todo("AUTH-034 [P1] Admin landing");
  test.todo("CAT-009 [P1] /categories/[slug]");
  test.todo("CAT-010 [P1] /bestsellers");
  test.todo("CAT-016 [P1] Home page");
  test.todo("CAT-018 [P2] Showcase filter bar");
  test.todo("CAT-019 [P2] Static pages smoke");
  test.todo("CAT-020 [P2] Out-of-stock badge on cards");
  test.todo("PDP-004 [P1] Inactive product page");
  test.todo("PDP-005 [P1] Variant switch");
  test.todo("PDP-007 [P1] Quantity and add to cart");
  test.todo("PDP-010 [P1] Offer display");
  test.todo("PDP-011 [P1] Approved reviews only");
  test.todo("PDP-012 [P1] WhatsApp CTA");
  test.todo("CMB-003 [P1] /combos listing");
  test.todo("CMB-004 [P1] Combo detail");
  test.todo("CMB-005 [P1] Unavailable combo page");
  test.todo("CMB-007 [P1] Add combo to cart");
  test.todo("CART-007 [P1] Persistence");
  test.todo("CART-009 [P1] Proceed to checkout as guest");
  test.todo("CART-011 [P1] Item removed after adding");
  test.todo("CPN-022 [P2] Coupon expires between Apply and Pay");
  test.todo("CHK-002 [P1] Saved default address prefill");
  test.todo("CHK-003 [P1] Client address validation");
  test.todo("CHK-019 [P2] Double click on Pay now");
  test.todo("CHK-020 [P1] Mobile checkout");
  test.todo("PAY-030 [P2] Payment still pending");
  test.todo("ORD-006 [P2] Admin opens a customer's PAID confirmation");
  test.todo("ORD-007 [P1] Purchase event fires once");
  test.todo("ORD-008 [P1] Order history");
  test.todo("ORD-009 [P1] Order detail page");
  test.todo("ORD-010 [P1] Delivered order review prompts");
  test.todo("TRK-010 [P1] Tracking page");
  test.todo("REV-009 [P1] Review lifecycle");
  test.todo("REV-010 [P2] Review from a delivered order");
  test.todo("PRF-009 [P1] Profile tabs");
  test.todo("PRF-010 [P1] Address manager UI");
  test.todo("PRF-011 [P2] Change password UI");
  test.todo("CON-008 [P2] Contact UI");
  test.todo("ANL-008 [P2] UTM capture in the browser");
  test.todo("ANL-009 [P2] Attribution carried to the order");
  test.todo("ADM-DSH-001 [P1] Stat cards");
  test.todo("ADM-DSH-002 [P2] Recent orders");
  test.todo("ADM-DSH-004 [P2] Empty state");
  test.todo("ADM-PRD-012 [P1] Edit price through the UI");
  test.todo("ADM-PRD-013 [P1] Deactivate");
  test.todo("ADM-PRD-014 [P2] Image URL rule");
  test.todo("ADM-CAT-004 [P1] Inactive category hidden");
  test.todo("ADM-CAT-005 [P2] Category UI CRUD");
  test.todo("ADM-CMB-006 [P1] Combo builder UI");
  test.todo("ADM-CPN-008 [P1] Coupon UI to checkout");
  test.todo("ADM-ORD-001 [P1] Orders list filter");
  test.todo("ADM-ORD-002 [P1] Admin-created order visibility");
  test.todo("ADM-ORD-022 [P2] Detail extras");
  test.todo("ADM-ORD-023 [P2] Create order UI");
  test.todo("ADM-USR-006 [P2] Users UI");
  test.todo("ADM-REV-003 [P2] Moderation UI");
  test.todo("ADM-CAR-007 [P1] Carousel UI to home");
  test.todo("ADM-TRK-002 [P2] Track any AWB page");
  test.todo("ADM-TRF-001 [P2] Traffic page");
  test.todo("ADM-TRF-005 [P2] Lead status UI");
  test.todo("ADM-EXP-006 [P2] Export buttons");
});

describe("plan todo: Unit", () => {
  test.todo("PDP-014 [P2] Product SEO metadata");
  test.todo("ORD-012 [P2] Estimated delivery");
  test.todo("TRK-009 [P2] Cache eviction");
  test.todo("SEO-004 [P2] Combos and offers in the sitemap");
});

describe("plan todo: API+E2E", () => {
  test.todo("CART-010 [P1] Stale cart price");
  test.todo("ADM-CMB-005 [P2] Delete while in carts");
});

describe("plan todo: Unit (jsdom)", () => {
  test.todo("ANL-012 [P2] PostHog wrappers");
  test.todo("ADM-PRD-015 [P2] Admin list search, filter and paging");
});

describe("plan todo: API", () => {
  test.todo("ADM-TRF-002 [P2] getTrafficActivity");
  test.todo("ADM-TRF-004 [P2] Lead summary and product stats");
  test.todo("ADM-EXP-005 [P2] Missing logo");
});

describe("plan todo: needs a dedicated database", () => {
  // Refusing to demote the last admin cannot be tested safely on the shared
  // DB: it would mean demoting every real admin first.
  test.todo("ADM-USR-003(c) [P0] cannot demote the last remaining admin");
});
