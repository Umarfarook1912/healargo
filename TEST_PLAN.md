# Healargo: Regression Test Plan

| | |
|---|---|
| **Status** | APPROVED and IMPLEMENTED (Nov 2026). See **section 8** for what is automated, the owner decisions (7.1) and the fix status of every finding (7.2). |
| **App** | Healargo storefront and admin (`D:\healargo`) |
| **Stack read** | Next.js 15 App Router, Prisma 6 on PostgreSQL (Supabase), NextAuth v5 (Credentials + Google, JWT sessions), Zustand cart, Cashfree PG (API `2023-08-01`) and webhook, ST Courier scraping, Brevo email, PostHog/GA, ExcelJS exports |
| **Written from** | A read-only snapshot of the source (no `.env`). Every route, field, rule and status below comes from the code. |

---

## 1. Scope and goals

**Goal:** have one command (`npm run test:all`) that tells us within minutes whether a change broke anything a customer or an admin depends on, from **sign-up and sign-in through to a paid, shipped and delivered order**.

In scope:

* **Customer side:** register, log in (email and Google), forgot and reset password, browsing (home, shop, categories, best sellers, offers, combos), product page, cart, coupons, checkout and addresses, Cashfree payment, confirmation, order history, order detail, live tracking, reviews, profile, addresses, password, contact form, UTM attribution and WhatsApp lead tracking.
* **Admin side:** route and role protection, dashboard, products, categories, combos, coupons, orders (create, status, payment, refund, delete, tracking, sync, export), users (create, edit, role, delete, export), reviews moderation, carousels, consignment tracking, traffic/attribution, WhatsApp leads and every Excel export.
* **Background and SEO:** `/api/cron/tracking-sync`, `sitemap.xml`, `robots.txt`.
* **Cross-cutting security:** unauthenticated and non-admin access, IDOR (users opening other users' orders), client price tampering, coupon abuse, stock limits, webhook signature, webhook replay and duplicates.

Out of scope (for now): load testing, visual pixel diffs, real Cashfree, ST Courier or Brevo calls in CI (all are mocked), and content-only static pages beyond a smoke check.

Success criteria:

1. Every **P0** case is automated and passes on `main` before any deploy.
2. The suite runs **locally on Windows** and in **GitHub Actions** with no real secrets.
3. Adding a feature means adding cases to the matching module table, keeping the IDs stable.

Priority meaning: **P0** means money, stock, auth or security; it blocks release. **P1** is a core feature behaving correctly. **P2** is an edge case, UX or reporting.

Layer meaning: **Unit** is pure functions in Vitest with no DB. **API** is Vitest calling the real route handler (or a lib function that hits the DB) against the database in `DATABASE_URL`, with auth and external HTTP faked. **E2E** is Playwright driving a real browser against `next dev` on the same database. By owner decision (Q6) that database is the app's **shared Supabase DB**: tests only add and remove their own marked rows (section 3.4).

---

## 2. Feature inventory

### 2.1 Customer side

| # | Feature | Pages | API routes | Key lib / components |
|---|---|---|---|---|
| U1 | Register | `/register` | `POST /api/auth/register` | `lib/auth/schemas.ts` (`registerSchema`), `features/auth/RegisterForm.tsx` |
| U2 | Email login / logout | `/login`, `/login/complete` | `/api/auth/[...nextauth]` (credentials) | `lib/auth/auth.ts` (`authorize`, `jwt`), `auth.config.ts`, `post-login.ts`, `LoginForm.tsx` |
| U3 | Google login | `/login` (button only when `AUTH_GOOGLE_ID/SECRET` set) | `/api/auth/[...nextauth]` (google) | `lib/auth/users.ts` (`upsertGoogleUser`), `GoogleSignInButton.tsx` |
| U4 | Forgot / reset password | `/forgot-password`, `/reset-password?token=` | `POST /api/auth/forgot-password`, `POST /api/auth/reset-password` | `lib/email/send-misc.ts` (`sendPasswordResetEmail`), 1 h TTL, sha256 token hash |
| U5 | Route protection | `/profile*`, `/orders*`, `/checkout*`, `/admin*` | `src/middleware.ts` matcher | `auth.config.ts` `authorized()` callback, `(admin)/layout.tsx` |
| U6 | Home and browsing | `/`, `/shop`, `/bestsellers`, `/categories/[slug]`, `/offers` | `GET /api/products`, `GET /api/categories`, `GET /api/catalog/highlights`, `GET /api/carousels/public` | `lib/products/queries.ts`, `lib/catalog/highlights.ts`, `lib/products/commerce.ts`, `features/home/*`, `ProductGrid.tsx` |
| U7 | Product detail | `/products/[slug]` | `GET /api/products/[id]`, `GET /api/reviews?productId=` | `getProductBySlug` (case-insensitive + fuzzy fallback), `ProductDetailClient.tsx`, `ProductPurchaseActions.tsx`, `QuantityStepper.tsx`, `OfferCountdown.tsx` |
| U8 | Combos | `/combos`, `/combos/[slug]` | `GET /api/combos` | `lib/catalog/get-combo.ts`, `comboIsLive`, `ComboDetailClient.tsx` |
| U9 | Cart | `/cart`, cart drawer | none (client only, `localStorage` key `healargo-cart`) | `hooks/useCartStore.ts`, `CartDrawer.tsx`, `CheckoutButton.tsx`, `useRequireLogin.ts` |
| U10 | Coupons | `/checkout` (coupon box) | `POST /api/coupons/validate` | `lib/orders/coupons.ts`, static fallback `PURE10` in `constants/coupons.ts` |
| U11 | Checkout and addresses | `/checkout` (Address, then Review and Pay) | `POST /api/orders`, `GET /api/user/addresses` | `lib/orders/inventory.ts` (`resolveOrderItemsFromCatalog`), `pricing.ts`, `lib/user/save-checkout-address.ts`, `CheckoutSavedAddresses.tsx` |
| U12 | Cashfree payment | redirect to Cashfree, then `/orders/[id]/confirmation?order_id=` | `POST /api/payment/cashfree`, `POST /api/payment/cashfree/status`, `POST /api/payment/cashfree/webhook` | `lib/payment/cashfree.ts`, `cashfree-auth.ts`, `cashfree-checkout.ts` (SDK), `webhook-auth.ts`, `site-url.ts`, `lib/orders/mark-paid.ts` |
| U13 | Confirmation and orders | `/orders/[id]/confirmation`, `/orders`, `/orders/[id]`, `/profile?tab=orders` | `GET /api/orders`, `GET /api/orders/[id]` | `CashfreeStatusSync.tsx`, `lib/analytics/purchase.ts`, `lib/email/send.ts` |
| U14 | Order tracking | `/orders/[id]/tracking` | `GET /api/orders/[id]/tracking` | `lib/shipping/st-courier.ts`, `sync-tracking.ts` (10-min cache), `ShipmentTrackingView.tsx` |
| U15 | Reviews | product page Reviews tab, delivered order page | `GET/POST /api/reviews` | `lib/reviews/stats.ts`, `order-reviews.ts`, `ProductReviews.tsx`, `OrderDeliveredReviews.tsx` |
| U16 | Profile, addresses, password | `/profile?tab=` (account, orders, addresses, password) | `GET/PUT /api/user/profile`, `GET/POST/PUT/DELETE /api/user/addresses`, `PUT /api/user/password` | `ProfileClient.tsx`, `AddressManager.tsx`, `ChangePasswordForm.tsx` |
| U17 | Contact | `/contact` | `POST /api/contact` | honeypot, 3 s minimum fill time, spam heuristics, 3 per IP per hour limit, `sendContactFormEmail` |
| U18 | Attribution and analytics | any page with `?utm_*` | `POST /api/analytics/visits`, `POST /api/analytics/whatsapp-clicks` | `lib/attribution/*`, `AttributionCapture.tsx`, `TrackedWhatsAppLink.tsx`, `lib/analytics/posthog.ts` |
| U19 | Static and SEO | `/about`, `/certificates`, `/gallery`, `/faqs`, `/privacy`, `/terms`, `/shipping`, `/refund`, `sitemap.xml`, `robots.txt` | none | `app/sitemap.ts`, `app/robots.ts`, `lib/seo/metadata.ts` |

### 2.2 Admin side (all under `(admin)/layout.tsx`, which redirects non-admins to `/login`)

| # | Feature | Pages | API routes (all require `role === "admin"`) | Key lib / components |
|---|---|---|---|---|
| A1 | Dashboard | `/admin` (redirects to `/admin/dashboard`) | none (server component Prisma queries) | `getOutOfStockProducts`, `AdminTrafficSources.tsx` |
| A2 | Products | `/admin/products`, `/new`, `/[id]` | `POST /api/products`, `PUT/DELETE /api/products/[id]`, `POST /api/admin/products/export` | `AdminProductForm.tsx`, `AdminImageUploader.tsx` (URL paste only), `RichTextEditor.tsx`, `normalizeProductVariants` |
| A3 | Categories | `/admin/categories` | `POST /api/categories`, `PUT/DELETE /api/categories/[id]` | `AdminCategoriesClient.tsx`, `AdminCategoryForm.tsx` |
| A4 | Combos | `/admin/combos`, `/new`, `/[id]` | `POST /api/combos`, `PUT/DELETE /api/combos/[id]`, `POST /api/admin/combos/export` | `AdminComboForm.tsx`, `AdminComboItems.tsx` |
| A5 | Coupons | `/admin/coupons` | `GET/POST /api/admin/coupons`, `PUT/DELETE /api/admin/coupons/[id]` | `AdminCouponModal.tsx`, `AdminCouponsClient.tsx` |
| A6 | Orders | `/admin/orders` (PAID and REFUNDED only), `/admin/orders/[id]` | `POST/PATCH /api/admin/orders`, `DELETE /api/admin/orders/[id]`, `POST .../[id]/refund`, `GET/PUT/DELETE .../[id]/tracking`, `POST .../[id]/tracking/sync`, `POST /api/admin/orders/export` | `AdminOrdersClient.tsx`, `AdminOrderStatusForm.tsx`, `AdminOrderTrackingCard.tsx`, `AdminCreateOrderForm.tsx`, `restoreStockForItems` |
| A7 | Users | `/admin/users` | `GET/POST/PATCH /api/admin/users`, `PUT/DELETE /api/admin/users/[id]`, `POST /api/admin/users/export` | `adminCreateUserSchema`, `adminUpdateUserSchema`, `adminUpdateRoleSchema`, last-admin guards |
| A8 | Reviews | `/admin/reviews` | `PATCH/DELETE /api/admin/reviews` | `recalculateProductReviewStats` |
| A9 | Carousels | `/admin/carousels` | `GET/POST /api/carousels`, `GET/PUT/DELETE /api/carousels/[id]`, `PATCH /api/carousels/[id]/status` | `lib/carousels/validation.ts` |
| A10 | Consignment tracking | `/admin/tracking?awb=` | `GET /api/admin/tracking?awb=` | `AdminTrackAnyConsignment.tsx` |
| A11 | Traffic and WhatsApp leads | `/admin/traffic` | `PATCH /api/admin/whatsapp-clicks/[id]` | `lib/attribution/report.ts`, `activity.ts`, `lib/whatsapp-leads/queries.ts`, `AdminWhatsAppLeads.tsx` |
| A12 | Exports | buttons on orders, users, products and combos | the 4 `.../export` routes (`POST`, `.xlsx`) | ExcelJS, logo from `public/healargo-logos/main-logo.png` |
| A13 | Cron tracking sync | none | `GET /api/cron/tracking-sync` (Bearer `CRON_SECRET`) | `syncShippedOrders` (50 per batch, 1.5 s spacing) |

### 2.3 Order and payment state machine (as implemented)

```
POST /api/orders              -> status PENDING,   paymentStatus PENDING, stockDecremented=false, coupon.timesUsed += 1
POST /api/payment/cashfree    -> sets cashfreeOrderId = HG-<last10 of id>-<6 digits> (overwritten on every call)
webhook SUCCESS / status PAID / confirmation-page sync / admin PATCH paymentStatus=PAID
                              -> markOrderPaid(): decrement stock (once), status CONFIRMED, paymentStatus PAID, emails
webhook FAILED|USER_DROPPED / status EXPIRED|TERMINATED -> paymentStatus FAILED
admin PUT tracking (paid only, 11-digit AWB) -> status SHIPPED (+shippedAt) if PENDING|CONFIRMED|PROCESSING
tracking fetch says "Delivered*" and status SHIPPED -> DELIVERED
admin refund                  -> restore stock (products only), paymentStatus REFUNDED, status CANCELLED
```

---

## 3. Test strategy and tooling

### 3.1 Layers

| Layer | Tool | What it covers | Speed | Runs |
|---|---|---|---|---|
| **Unit** | Vitest (`node`; `jsdom` per file for the Zustand store and `localStorage` helpers) | Pure logic: `commerce.ts` (offers, selling price, combos), `pricing.ts`, coupon math (`getCouponDiscount`, `normalizeCouponCode`), zod schemas (auth, carousel, contact, order), `attribution/parse.ts`, `labels.ts`, `webhook-auth.ts`, `site-url.ts`, `cashfree-auth.ts`, `st-courier.ts` parser, `delivery.ts`, `format.ts`, `whatsapp.ts`, the cart store, `authorized()` and `jwt`/`session` callbacks, `requireAdmin` | < 10 s | every save and every PR |
| **API / integration** | Vitest calling exported `GET/POST/PUT/PATCH/DELETE` handlers directly, real Prisma on the shared DB (marked rows only, 3.4) | Every route in section 2: auth and role checks, validation, DB side effects (stock, coupon usage, order states), IDOR, tampering, webhook signature and idempotency | 1 to 3 min | every PR |
| **E2E** | Playwright (Chromium; one mobile viewport project for checkout) | Critical customer and admin journeys through the real UI, middleware redirects, SDK redirect, confirmation page | 5 to 10 min | every PR to `main` (P0 only) and nightly (all) |

How API tests call handlers (no HTTP server is needed):

```ts
import { POST } from "@/app/api/orders/route";
mockSession(customerA);                              // helper, see 3.3
const res = await POST(jsonRequest("/api/orders", { items, shippingAddress }));
expect(res.status).toBe(200);
// dynamic routes: GET(req, { params: Promise.resolve({ id }) })
```

### 3.2 Mocking external services

> **As implemented:** instead of MSW, one small fake HTTP server (`tests/helpers/fake-services.ts`) plays Cashfree, ST Courier and Brevo for both the API and E2E suites. The app reaches it through the test-only overrides `CASHFREE_BASE_URL` (ignored when `CASHFREE_ENV=PRODUCTION`), `ST_COURIER_BASE_URL` and `BREVO_API_URL`; when they are unset the app behaves as before. PostHog/GA keys are forced empty. The table below is the original design.

| Service | Where it is called | API test strategy | E2E strategy |
|---|---|---|---|
| **NextAuth session** | `auth()` from `@/lib/auth/auth` in every route | `vi.mock("@/lib/auth/auth", () => ({ auth: vi.fn() }))`, plus helpers `asAnon()`, `asCustomer(user)`, `asAdmin(user)` returning `{ user: { id, email, name, role } }` | Real login through the UI in Playwright `globalSetup`, saved to `tests/e2e/.auth/{admin,customer}.json` (`storageState`) |
| **Credentials `authorize`** | inline inside `NextAuth({...})` | Not reachable directly. Covered by E2E. *Optional seam:* move the function into `lib/auth/authorize-credentials.ts` so it can be unit-tested (see Q2). | Real |
| **Google OAuth** | provider and `signIn` callback | Test `upsertGoogleUser()` against the DB and the `jwt`/`session` callbacks as units. The OAuth round-trip itself is **not** automated. | Only assert the button shows or hides with env vars. Manual check before releases. |
| **Cashfree REST** (`/pg/orders`, `/pg/orders/{id}`) | `lib/payment/cashfree.ts` via global `fetch` | **MSW** (`msw/node`) handlers for `https://sandbox.cashfree.com/pg/orders*` with scenarios: created, API error, `PAID`, `ACTIVE`, `EXPIRED`, `TERMINATED`, network error | Needs one small seam (Q1): an env override for the Cashfree host (e.g. `CASHFREE_API_BASE_URL`) pointing at a tiny mock server (`tests/mocks/cashfree-server.ts`) that Playwright starts |
| **Cashfree JS SDK** | `https://sdk.cashfree.com/js/v3/cashfree.js` | n/a | `page.route()` serves a fake SDK whose `checkout()` navigates to `return_url` (success) or to the confirmation page with a FAILED/EXPIRED mock state |
| **Cashfree webhook signature** | `verifyCashfreeWebhookSignature` (base64 HMAC-SHA256 of `x-webhook-timestamp + rawBody` with `CASHFREE_SECRET_KEY`) | Test helper `signWebhook(body, ts, secret)` builds valid headers. Negative tests tamper with the body, timestamp, secret and headers. | Test calls `POST /api/payment/cashfree/webhook` with a signed payload to simulate Cashfree |
| **Brevo email** | `sendBrevoEmail` (`fetch https://api.brevo.com/v3/smtp/email`), console fallback when `BREVO_API_KEY`/`EMAIL_FROM` unset | `vi.mock("@/lib/email/send")` to assert calls (to, order id), plus one MSW test of `sendBrevoEmail` payload and error | Leave Brevo unset (console mode). For the reset-password journey, the test writes a known token hash straight into the DB. |
| **ST Courier** | `fetchStCourierTracking` (GET page for cookie, POST `/track/doCheck`, GET result HTML) | MSW with recorded HTML fixtures in `tests/fixtures/st-courier/*.html` (in transit, delivered, not found, `code != 200`, no cookie). Clear the in-memory cache between tests (expose a test reset or `vi.resetModules()`). | Pre-set `trackingStatus` on fixture orders, or use the same base-URL seam (Q1) |
| **PostHog / GA** | `posthog-js`, `window.gtag` | Unit: with no token `initPostHog()` returns `null`; `capturePostHogEvent` never throws; `trackPurchase` dedupes | Env token unset. Assert `window.dataLayer` gets one `purchase` event. Block `*.posthog.com` with `page.route`. |
| **`next/cache`** | `revalidatePath` in products, categories and carousels routes | `vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))` (it throws outside a Next request) and assert calls | Real |
| **Time** | offers, combos, coupons, reset TTL, tracking cache, contact 3 s rule | `vi.useFakeTimers()` / `vi.setSystemTime()` | Fixtures use dates relative to "now" |

### 3.3 Test data and fixtures

`tests/fixtures/factories.ts` builds rows with Prisma. `tests/fixtures/seed-test.ts` creates the **standard world** below before each API file (and once for E2E):

| Fixture | Details |
|---|---|
| `admin` | `admin@test.healargo.local`, role `admin`, password from `.env.test` (`TEST_ADMIN_PASSWORD`) |
| `admin2` | second admin, needed for the last-admin rule tests |
| `customerA`, `customerB` | role `user`, email and password, one saved default address each |
| `googleUser` | role `user`, `passwordHash = null` |
| `catOils` / `catHidden` | active and inactive categories |
| `pSesame` | active; variants `v1L` (price 350, originalPrice 400, stock 10), `v5L` (stock 0), `vToggleOff` (`available:false`) |
| `pOffer` | `offerEnabled`, window = now - 1 day to now + 1 day, `v1` price 500, offerPrice 420, stock 50 |
| `pOfferExpired` | offer window in the past |
| `pInactive` | `isActive:false` |
| `pGstExempt` | `gstExempt:true` |
| `comboLive` | items: `pSesame/v1L × 2` + one custom item; price 600, originalPrice 800 |
| `comboInactive`, `comboExpired` | for availability tests |
| Coupons | `PCT10` (10 %), `FLAT50` (fixed 50), `EXPIRED`, `FUTURE`, `OFF` (INACTIVE), `USEDUP` (limit 1, used 1), `ONLYSESAME` (applicableProducts=[pSesame]), `ONLYV1L` (applicableVariants=[v1L]); (the hard-coded `PURE10` was removed, Q4) |
| Orders | `orderA_paid` (customerA, PAID, stockDecremented), `orderA_pending` (with `cashfreeOrderId`), `orderB_paid` (customerB), `orderA_shipped` (AWB `58240292331`), `orderA_delivered` |
| Carousels, visits, WhatsApp clicks | 2 active and 1 inactive slide; visits with UTM; leads in every status |

### 3.4 Isolation, cleanup and safety

> **Changed after approval (Q6: "for test we use same database").** The original design below (separate `*_test` DB, `db push --force-reset`, `TRUNCATE` per test) was **replaced**, because the suites run against the app's shared Supabase database:

* **Shared database, run-prefix cleanup.** Nothing is ever truncated, reset or force-pushed, and `scripts/seed.ts` is never used. Every fixture row carries a run marker (`hgtest<run>`: emails `test+hgtest…@healargo.test`, slugs and names, coupon codes `HGTEST…`, order shipping names). `tests/fixtures/cleanup.ts` deletes **only** rows containing the marker, in FK-safe order, after each API file and after the E2E run; leftovers of crashed runs are swept next time.
* **Explicit opt-in.** API and E2E refuse to start unless `TESTS_MAY_WRITE_TO_DATABASE=yes` (in `.env.test.local`), and print which host/DB they will write to.
* **No global assertions.** Tests that read dashboards, exports or lists assert only on their own rows. The admin access sweep snapshots real rows and checks nothing changed. The cron sync is tested with a mocked Prisma client so real shipments are never touched. ADM-USR-003(c) (last admin) cannot run on a shared DB and stays a todo.
* Each suite builds its own fixtures with `tests/fixtures/factory.ts` instead of one big "std world"; E2E's `global-setup.ts` creates a small world (two customers, an admin, a category, a product with an in-stock 1L and out-of-stock 5L variant, an inactive product, a coupon).
* API tests run **serially** (one fork, `fileParallelism: false`).
* In-memory state that leaks between tests and must be reset: ST Courier `trackingCache`, contact-form `hits` rate-limit map, `trackPurchase` `trackedOrders`. Use `vi.resetModules()` in those files.
* E2E runs with one worker on the same shared DB, creating its world in `globalSetup` and deleting it in `globalTeardown`.

---
## 4. Test cases

### 4.0 Summary

**335 test cases** in total: **P0 114**, **P1 143**, **P2 78**. By layer: API 190, E2E 91, Unit 48, mixed 6. **50** cases are marked ⚠️ (current code behaves differently from the likely intent; see 7.2).

| Module | IDs | Cases | P0 | P1 | P2 |
|---|---|---|---|---|---|
| Auth and route protection | AUTH | 38 | 17 | 16 | 5 |
| Catalog and browsing | CAT | 21 | 5 | 7 | 9 |
| Product detail | PDP | 14 | 4 | 6 | 4 |
| Combos | CMB | 12 | 6 | 4 | 2 |
| Cart | CART | 13 | 4 | 7 | 2 |
| Coupons | CPN | 22 | 13 | 7 | 2 |
| Checkout and order creation | CHK | 20 | 10 | 8 | 2 |
| Payment (Cashfree, webhook, mark-paid) | PAY | 30 | 16 | 12 | 2 |
| Orders and confirmation | ORD | 15 | 5 | 6 | 4 |
| Customer order tracking | TRK | 10 | 5 | 4 | 1 |
| Reviews | REV | 10 | 1 | 6 | 3 |
| Profile, addresses, password | PRF | 11 | 5 | 5 | 1 |
| Contact | CON | 8 | 1 | 5 | 2 |
| Analytics and attribution | ANL | 13 | 3 | 4 | 6 |
| Admin dashboard | ADM-DSH | 4 | 0 | 2 | 2 |
| Admin products | ADM-PRD | 15 | 4 | 6 | 5 |
| Admin categories | ADM-CAT | 5 | 0 | 4 | 1 |
| Admin combos | ADM-CMB | 6 | 1 | 3 | 2 |
| Admin coupons | ADM-CPN | 8 | 2 | 6 | 0 |
| Admin orders (status, refund, tracking, sync, delete) | ADM-ORD | 23 | 7 | 10 | 6 |
| Admin users | ADM-USR | 6 | 2 | 3 | 1 |
| Admin reviews | ADM-REV | 3 | 1 | 1 | 1 |
| Admin carousels | ADM-CAR | 7 | 1 | 3 | 3 |
| Admin consignment tracking | ADM-TRK | 2 | 0 | 1 | 1 |
| Admin traffic and WhatsApp leads | ADM-TRF | 5 | 0 | 1 | 4 |
| Admin exports | ADM-EXP | 6 | 0 | 2 | 4 |
| Cron tracking sync | CRN | 4 | 1 | 2 | 1 |
| SEO (sitemap, robots, metadata) | SEO | 4 | 0 | 2 | 2 |
| **Total** | | **335** | **114** | **143** | **78** |

Conventions: "std world" means the fixtures in 3.3. In the Expected column, ⚠️ marks a case where the **code today does something different from what is probably intended**. Those are written against the *intended* behaviour. The owner chose to **fix** them (Q3), so they are plain passing tests now (see 7.2 and section 8). Pages are written as routes and APIs as `METHOD path`.

### 4.1 Auth (AUTH)

| ID | Case | Layer | Pri | Preconditions | Steps | Expected |
|---|---|---|---|---|---|---|
| AUTH-001 | Register happy path | API | P0 | empty users | `POST /api/auth/register` `{name:"Ravi K", email:"Ravi@Test.com", password:"secret1", phone:"9876543210"}` | 200, `data.role="user"`; DB email stored lower-case `ravi@test.com`; `passwordHash` is bcrypt (not plain), phone saved |
| AUTH-002 | Register duplicate email (any case) | API | P0 | customerA exists | register with `CUSTOMERA@...` | 409 `"Email already registered"`; no second row |
| AUTH-003 | Register validation | API | P0 | none | table-driven: bad email; password 5 chars; name 1 char; missing fields | 400 `"Please check the form and try again"` for each |
| AUTH-004 | Register cannot self-assign admin | API | P0 | none | body includes `role:"admin"` | 200 and stored role is `user` |
| AUTH-005 | Schema boundaries | Unit | P1 | none | `credentialsSchema`/`registerSchema`/`adminCreateUserSchema`: password length 6 passes and 5 fails, name length 2 passes and 1 fails, role defaults to `user`, unknown role rejected | as stated |
| AUTH-006 | Email login success | E2E | P0 | customerA | `/login`, fill email and password, Sign in | toast "Welcome back"; lands on `/` (`getPostLoginRoute`); header shows profile menu; session cookie set |
| AUTH-007 | Wrong password | E2E | P0 | customerA | wrong password | toast "Invalid email or password"; stays on `/login`; no session |
| AUTH-008 | Unknown email gives the same generic error | E2E | P1 | none | unknown email | same message as AUTH-007 (no account enumeration) |
| AUTH-009 | Email is case-insensitive at login | E2E | P1 | customerA | log in with upper-case email | success |
| AUTH-010 | Google-only account cannot use password login | E2E | P1 | googleUser | any password | "Invalid email or password" |
| AUTH-011 | Logged-in user opening `/login` | E2E | P1 | logged in | visit `/login` | redirected to `/` |
| AUTH-012 | Register UI | E2E | P1 | none | mismatched confirm password, then a valid submit | mismatch shows "Passwords do not match"; valid submit creates the account, auto signs in and redirects |
| AUTH-013 | Logout | E2E | P1 | logged in | profile menu, then Sign out | lands on `/login`; `/profile` now redirects to login |
| AUTH-014 | `upsertGoogleUser` creates a new user | API | P1 | none | call with `{email:"New@G.com", name:"", image:"x"}` | user created with role `user`, email lower-case, name falls back to `new`, image saved, no password |
| AUTH-015 | `upsertGoogleUser` with an existing user | API | P1 | admin exists | call with the admin's email and a new image | image updated; **role stays admin**; no duplicate row; with the same image, no update |
| AUTH-016 | `upsertGoogleUser` with no email | API | P1 | none | `{email:null}` | returns `null`, so the `signIn` callback returns false |
| AUTH-017 | `jwt` / `session` callbacks | Unit | P0 | mock `findAuthUserByEmail` | call `jwt({token,user})` then `session({session,token})` | `token.id/role/picture` come from the DB user; `session.user.role` defaults to `user` when missing |
| AUTH-018 | Google button visibility | E2E | P2 | env | start with and without `AUTH_GOOGLE_ID/SECRET` | button hidden when unset, shown when set |
| AUTH-019 | OAuth error toast | E2E | P2 | none | `/login?error=OAuthCallback` | toast "Google sign-in failed. Please try again." |
| AUTH-020 | Forgot password, existing account | API | P0 | customerA; mock `sendPasswordResetEmail`; Brevo env set | `POST /api/auth/forgot-password {email}` | 200 generic message; DB has `passwordResetTokenHash` = sha256(token) and expiry about now + 60 min; email called with `.../reset-password?token=<64 hex>`; **raw token not in the response** |
| AUTH-021 | Forgot password, unknown email | API | P0 | none | unknown email | identical 200 body; no DB writes; email not called |
| AUTH-022 | Forgot password, Google-only user | API | P1 | googleUser | request | identical 200; no token stored |
| AUTH-023 | Forgot password, bad email / Brevo unset | API | P2 | none | `{email:"x"}`; then a valid email with Brevo env unset | 400 `"Invalid email"`; with Brevo unset it logs `[password-reset]` and still returns 200 |
| AUTH-024 | Reset password success | API | P0 | token issued (known raw token) | `POST /api/auth/reset-password {token,newPassword:"newpass1"}` | 200; hash changed; token fields cleared to null; bcrypt matches the new password only |
| AUTH-025 | Reset with expired token | API | P0 | `passwordResetExpiresAt` 1 minute in the past | reset | 400 `"Reset link is invalid or expired"`; password unchanged |
| AUTH-026 | Reset token reuse | API | P0 | AUTH-024 done | same token again | 400 |
| AUTH-027 | Reset validation | API | P1 | none | token of 19 chars; newPassword of 5 chars | 400 `"Invalid reset request"` |
| AUTH-028 | Forgot and reset journey | E2E | P1 | customerA; test writes a known token hash to the DB | `/forgot-password` submit; then `/reset-password?token=...` and set a new password; log in | "If an account exists..." message shown; reset success message; login works with the new password and fails with the old |
| AUTH-029 | `/login/complete` | E2E | P2 | none | visit as anonymous, then as logged in | anonymous goes to `/login`; logged in goes to `/` |
| AUTH-030 | `authorized()` decision matrix | Unit | P0 | none | call `authConfig.callbacks.authorized` with paths `/admin/x`, `/profile`, `/orders/1`, `/checkout`, `/shop`, as anonymous, user and admin | admin paths: only admin is true. profile, orders, checkout: any user. Public paths: always true |
| AUTH-031 | Middleware matcher snapshot | Unit | P1 | none | import `config` from `src/middleware.ts` | matcher contains `/admin/:path*`, `/profile`, `/orders`, `/orders/:path*`, `/checkout`, `/checkout/:path*` (fails if a protected area is added or removed without review) |
| AUTH-032 | Anonymous user hits protected pages | E2E | P0 | anonymous | open `/checkout`, `/profile`, `/orders`, `/orders/<id>/confirmation` | each redirects to `/login?callbackUrl=...` |
| AUTH-033 | Customer hits admin pages | E2E | P0 | customerA logged in | open `/admin`, `/admin/orders`, `/admin/users` | redirected to `/login`; no admin markup rendered |
| AUTH-034 | Admin landing | E2E | P1 | admin | open `/admin` | redirected to `/admin/dashboard`; sidebar visible |
| AUTH-035 | `requireAdmin()` | Unit | P0 | mock `auth` | null session, user session, admin session | 401 `{error:"Unauthorized"}`, 401, `{ok:true}` |
| AUTH-036 | **Admin API sweep** (table-driven) | API | P0 | std world | For each admin endpoint: `POST /api/products`, `PUT/DELETE /api/products/[id]`, `POST /api/categories`, `PUT/DELETE /api/categories/[id]`, `POST /api/combos`, `PUT/DELETE /api/combos/[id]`, `GET/POST /api/carousels`, `GET/PUT/DELETE /api/carousels/[id]`, `PATCH /api/carousels/[id]/status`, `GET/POST /api/admin/coupons`, `PUT/DELETE /api/admin/coupons/[id]`, `POST/PATCH /api/admin/orders`, `DELETE /api/admin/orders/[id]`, `POST .../refund`, `GET/PUT/DELETE .../tracking`, `POST .../tracking/sync`, `GET /api/admin/tracking`, `GET/POST/PATCH /api/admin/users`, `PUT/DELETE /api/admin/users/[id]`, `PATCH/DELETE /api/admin/reviews`, `PATCH /api/admin/whatsapp-clicks/[id]`, the 4 export routes: call as **anonymous** and as **customerA** | always 401; **no DB row changed** (compare row counts and `updatedAt` before and after) |
| AUTH-037 | Demoted admin keeps access (stale JWT role) | API+E2E | P1 | admin2 logged in (storageState); admin demotes admin2 | admin2 calls `GET /api/admin/users` with the old cookie | ⚠️ Intended: 401. Today the role lives in the JWT (`requireAdmin` reads `session.user.role`, which is not re-read from the DB), so access continues until re-login or token expiry |
| AUTH-038 | Login honours `callbackUrl` | E2E | P2 | anonymous | `/checkout` redirects to `/login?callbackUrl=/checkout`; log in | ⚠️ Intended: return to `/checkout`. Today `LoginForm` always pushes `/` |

### 4.2 Catalog and browsing (CAT)

| ID | Case | Layer | Pri | Preconditions | Steps | Expected |
|---|---|---|---|---|---|---|
| CAT-001 | Public product list | API | P0 | std world | `GET /api/products` | only `isActive` products, newest first, `categoryId` populated as an object, variants have `_id` |
| CAT-002 | Best seller filter | API | P1 | 1 best seller | `GET /api/products?bestSeller=true` | only best sellers |
| CAT-003 | Inactive products via `?active=false` | API | P1 | pInactive | anonymous `GET /api/products?active=false` | ⚠️ Today anonymous users get inactive products (used by the admin combo form). Intended: admin-only, or strip inactive for non-admins |
| CAT-004 | Product by id | API | P2 | none | `GET /api/products/[id]` for existing, unknown and inactive ids | 200 / 404 `"Not found"` / ⚠️ inactive returned publicly |
| CAT-005 | Categories list | API | P2 | catHidden | `GET /api/categories` | sorted by `sortOrder`; ⚠️ includes inactive (decide) |
| CAT-006 | `getProducts({categorySlug})` matching | API | P1 | catOils `wood-pressed-oils` | slugs `wood-pressed-oils`, `WOOD_PRESSED_OILS`, `woodpressed`, `unknown`, the inactive category's slug | first three match catOils; unknown and inactive return `[]` |
| CAT-007 | `getCategoryBySlug` | API | P2 | same | same inputs | category or `null` |
| CAT-008 | `/shop` | E2E | P0 | std world | open `/shop` | all active products are shown; pInactive is not |
| CAT-009 | `/categories/[slug]` | E2E | P1 | std world | valid slug and unknown slug | lists only that category's products; unknown shows the not-found/empty state |
| CAT-010 | `/bestsellers` | E2E | P1 | std world | open | only best sellers |
| CAT-011 | `/offers` | API+E2E | P1 | pOffer, pOfferExpired | `getLiveOffers()` and open `/offers` | contains pOffer only |
| CAT-012 | `offerIsLive` | Unit | P0 | none | disabled; missing start or end; now before start; after end; exactly on start and end; invalid dates | false, false, false, false, **true** (inclusive), false |
| CAT-013 | `sellingPrice` / `compareAtPrice` | Unit | P0 | none | live offer with offerPrice 420; offerPrice 0 or undefined; no offer | 420 and compareAt=`price`; falls back to `price`; compareAt=`originalPrice` |
| CAT-014 | `variantIsAvailable` | Unit | P0 | none | `available:true, stock:0`; `available:false, stock:5`; no flag with stock 0 / 3 | true; false; false; true |
| CAT-015 | `variantDisplayImage` | Unit | P2 | none | variant image; blank variant image with product images `["", "a.jpg"]`; nothing | variant image; `a.jpg`; fallback |
| CAT-016 | Home page | E2E | P1 | 2 active + 1 inactive slide | open `/` | hero carousel shows the 2 active slides in `sortOrder`; category strip, best sellers and highlights render; no console errors |
| CAT-017 | `/api/catalog/highlights` | API | P2 | with and without live offer/combo; DB throwing | GET | `{hasOffers,hasCombos}` correct; on DB error both false with 200 |
| CAT-018 | Showcase filter bar | E2E | P2 | mixed flags | click Best Sellers / New Arrivals chips | grid and counts update |
| CAT-019 | Static pages smoke | E2E | P2 | none | open `/about /certificates /gallery /faqs /privacy /terms /shipping /refund /contact` | HTTP 200, `<h1>` present, no console errors |
| CAT-020 | Out-of-stock badge on cards | E2E | P2 | product whose only variant has stock 0 | open `/shop` | "Out of stock" text on the card |
| CAT-021 | Formatting utils | Unit | P2 | none | `slugify("Sesame Oil (1L)!")`, `stripHtml("<p>a</p> b")`, `formatInr(1234.5)`, `truncate` | `sesame-oil-1l`, `a b`, `₹1,234.5`, ellipsis at max |

### 4.3 Product detail (PDP)

| ID | Case | Layer | Pri | Preconditions | Steps | Expected |
|---|---|---|---|---|---|---|
| PDP-001 | Renders price block | E2E | P0 | pSesame | open `/products/<slug>` | name, ₹350 selling, ₹400 struck, discount 13 % |
| PDP-002 | Slug case-insensitive | API | P2 | pSesame | `getProductBySlug(slug.toUpperCase())` | returns pSesame |
| PDP-003 | Fuzzy slug fallback | API | P2 | pSesame | `getProductBySlug("best-sesame-thing")` | ⚠️ Today returns pSesame (token match), which serves the wrong product for typos and mistyped URLs (SEO soft-duplicates). Decide: keep, or 404 / redirect to the canonical slug |
| PDP-004 | Inactive product page | E2E | P1 | pInactive | open its slug | 404 page |
| PDP-005 | Variant switch | E2E | P1 | pSesame | click each variant | price, image and availability update |
| PDP-006 | Out-of-stock variant | E2E | P0 | `v5L` (stock 0), `vToggleOff` | select each | "Add to Cart" shows Out of stock and is disabled, Buy Now disabled, `+` disabled |
| PDP-007 | Quantity and add to cart | E2E | P1 | pSesame | set quantity 3 with `+`, Add to Cart; `−` never goes below 1 | toast "Added to cart"; cart has quantity 3 |
| PDP-008 | Buy Now as guest | E2E | P0 | anonymous | Buy Now | toast "Sign in to complete your purchase"; redirected to `/login`; cart unchanged |
| PDP-009 | Buy Now logged in | E2E | P0 | customerA with another item in cart | Buy Now | cart **replaced** by this single line; navigates to `/checkout` |
| PDP-010 | Offer display | E2E | P1 | pOffer, pOfferExpired | open both | pOffer shows ₹420 and the countdown; expired shows the regular price and no countdown |
| PDP-011 | Approved reviews only | E2E | P1 | 1 approved + 1 pending review | open the Reviews tab | only the approved review; average and count match |
| PDP-012 | WhatsApp CTA | E2E | P1 | pSesame | click "Chat on WhatsApp" (intercept `wa.me` popup) | URL has encoded product, variant, price and quantity; `POST /api/analytics/whatsapp-clicks` sent with `context:"product"` |
| PDP-013 | Share links | Unit | P2 | none | `productShareLinks(name,url)` | WhatsApp, Facebook, etc. URLs are encoded correctly |
| PDP-014 | Product SEO metadata | Unit | P2 | product with `seo.metaTitle` | `generateMetadata` / `buildPageMetadata` | title, description, canonical `${SITE}/products/<slug>`, OG image |

### 4.4 Combos (CMB)

| ID | Case | Layer | Pri | Preconditions | Steps | Expected |
|---|---|---|---|---|---|---|
| CMB-001 | Public combo list | API | P2 | comboInactive | `GET /api/combos` | ⚠️ returns inactive and expired combos to anyone (decide) |
| CMB-002 | `comboIsLive` | Unit | P0 | none | `isActive:false`; window around now; window past; **only `startsAt` set in the future**; invalid dates | false; true; false; ⚠️ true (a single date is ignored); false |
| CMB-003 | `/combos` listing | E2E | P1 | live, inactive, expired | open | only comboLive |
| CMB-004 | Combo detail | E2E | P1 | comboLive | open `/combos/<slug>` | lines show live unit prices (pSesame 350 × 2) plus the custom line's `customPrice`; "worth" = max(separate total, originalPrice); savings shown |
| CMB-005 | Unavailable combo page | E2E | P1 | inactive, expired | open slugs | 404 |
| CMB-006 | `getComboBySlug` custom lines | API | P2 | comboLive | call | custom line uses `customPrice` and `customImage`; missing product/variant treated as custom |
| CMB-007 | Add combo to cart | E2E | P1 | comboLive | Add to Cart | cart line `productId = variantId = combo._id`, price 600, stock 999 |
| CMB-008 | Order with combo line | API | P0 | comboLive | `POST /api/orders` items `[{productId:combo.id, variantId:combo.id, quantity:2}]` | 200; item price 600 (server), `variantLabel` = "pSesame 1L × 2, ..." summary, `pricing.total` = 1200 |
| CMB-009 | Order with inactive or expired combo | API | P0 | comboInactive | same | 400 `"One or more products are unavailable"` |
| CMB-010 | Paying a combo order decrements components | API | P0 | CMB-008 order | `markOrderPaid` | pSesame `v1L` stock −4 (2 per combo × 2); custom line skipped |
| CMB-011 | Combo with insufficient component stock | API | P0 | pSesame `v1L` stock 1 | create a combo order, then a webhook SUCCESS | ⚠️ Intended: order creation rejected (400, out of stock). Today order creation passes and `markOrderPaid` throws "Failed to reserve stock...", so the webhook returns 500 and the order stays PENDING after the customer has paid |
| CMB-012 | Refunding a combo order restores components | API | P0 | paid combo order | `POST /api/admin/orders/[id]/refund` | ⚠️ Intended: pSesame stock restored. Today `restoreStockForItems` only looks up products, so combo lines are skipped and the stock is lost |

### 4.5 Cart (CART)

| ID | Case | Layer | Pri | Preconditions | Steps | Expected |
|---|---|---|---|---|---|---|
| CART-001 | `addItem` merge and stock cap | Unit (jsdom) | P0 | empty store | add `{qty 4, stock 5}` twice | one line, quantity 5 (capped at stock) |
| CART-002 | `addItem` refreshes price, stock and GST flag | Unit | P1 | line exists | add the same line with a new price and stock | price and stock updated to the newest payload |
| CART-003 | `buyNowItem` | Unit | P0 | 2 lines | buyNow `{qty 0}` and `{qty 99, stock 5}` | cart has exactly 1 line; quantity clamped to 1 and to 5 |
| CART-004 | `updateQuantity` clamps | Unit | P1 | line stock 5 | set 0, set 10 | becomes 1 (not removed), becomes 5 |
| CART-005 | `removeItem` precision | Unit | P1 | same product with 2 variants | remove one | the other variant remains |
| CART-006 | Subtotal and count | Unit | P0 | 2 lines | `getSubtotal`, `getItemCount` | Σ price×qty and Σ qty |
| CART-007 | Persistence | E2E | P1 | none | add an item, reload, open a new tab | item still present (`localStorage["healargo-cart"]`) |
| CART-008 | `/cart` page | E2E | P0 | 2 items | `+` / `−` / remove; then empty | subtotal updates; empty state with Shop link |
| CART-009 | Proceed to checkout as guest | E2E | P1 | anonymous with items | drawer, Checkout | login-required toast and redirect to `/login` |
| CART-010 | Stale cart price | API+E2E | P1 | add pSesame at 350; admin changes the price to 380 | checkout and pay | server order total 380×qty (server wins). ⚠️ The checkout UI still shows 350 until the cart is re-added (decide: refresh cart prices on checkout load) |
| CART-011 | Item removed after adding | E2E | P1 | add pSesame; admin deactivates it | Pay now | toast "One or more products are unavailable"; no order created |
| CART-012 | `syncProductFlags` | Unit | P2 | lines | sync with changed and unchanged flags | state object identity is kept when nothing changed |
| CART-013 | Cart WhatsApp message | Unit | P2 | 2 lines | `buildCartWhatsAppMessage(items,total)` and `buildWhatsAppUrl` | contains every line and the total; URL-encoded `wa.me` link |

### 4.6 Coupons (CPN)

| ID | Case | Layer | Pri | Preconditions | Steps | Expected |
|---|---|---|---|---|---|---|
| CPN-001 | `normalizeCouponCode` | Unit | P1 | none | `" pct10 "`, `""`, `undefined` | `PCT10`, `undefined`, `undefined` |
| CPN-002 | No code | API | P1 | none | `validateAndCalculateCouponDiscount({code:undefined})` | `{discount:0}` with no error |
| CPN-003 | Percentage coupon | API | P0 | PCT10 | `POST /api/coupons/validate {code:"PCT10", subtotal:1005}` | `valid:true`, `discount:101` (rounded) |
| CPN-004 | Fixed coupon | API | P0 | FLAT50 | subtotal 1000; then subtotal 30 | 50; then 30 (capped at the eligible subtotal) |
| CPN-005 | Inactive | API | P0 | OFF | validate | `valid:false`, `"This coupon is currently inactive"` (HTTP 200) |
| CPN-006 | Not started | API | P0 | FUTURE | validate | `"This coupon is not active yet"` |
| CPN-007 | Expired | API | P0 | EXPIRED | validate | `"This coupon has expired"` |
| CPN-008 | Usage limit | API | P0 | USEDUP; another coupon with `usageLimit:0, timesUsed:500` | validate both | first: `"...maximum usage limit"`; second valid (0 = unlimited) |
| CPN-009 | Product restriction | API | P0 | ONLYSESAME; cart pSesame 350×2 + pOffer 420 | validate (10 %) | discount computed on 700 only, so 70 |
| CPN-010 | Variant restriction | API | P0 | coupon with both `applicableProducts=[pSesame]` and `applicableVariants=[v1L]`; cart has pSesame `v5L` and `v1L` | validate | only the `v1L` line is eligible (a product match alone is ignored when variant restrictions exist) |
| CPN-011 | Restricted, nothing eligible | API | P0 | ONLYSESAME; cart only pOffer | validate | `"This coupon is not applicable to any products or variants in your cart"` |
| CPN-012 | Restricted, no items sent | API | P1 | ONLYSESAME | validate without `items` | `"Cart items required to validate coupon restrictions"` |
| CPN-013 | Static `PURE10` fallback and DB precedence | API | P1 | no DB row; then DB row `PURE10` INACTIVE | validate `pure10` | 10 % discount; then once the DB row exists, `"currently inactive"` (the DB wins) |
| CPN-014 | Unknown code | API | P0 | none | `NOPE` | `valid:false`, `"Invalid or expired coupon code"` |
| CPN-015 | Validate endpoint schema | API | P1 | none | missing code; `subtotal:-1`; item `quantity:0`; price −1 | 400 `valid:false` with the first zod message |
| CPN-016 | Client tampering via validate | API | P0 | PCT10 | validate with a fake `subtotal: 100000` (ok, preview only), then `POST /api/orders` with real items and `couponCode:"PCT10"` | the order discount is recomputed from **server** prices (10 % of the real subtotal), not the preview |
| CPN-017 | Discount bigger than subtotal | API | P1 | coupon PERCENTAGE 150 (admin can create it) | create an order | `pricing.total = 0` (clamped) but `pricing.discount > subtotal`; Cashfree init with amount 0 fails. ⚠️ Intended: admin API rejects percentage > 100 (see ADM-CPN-005) |
| CPN-018 | Usage counted at order creation | API | P0 | PCT10 timesUsed 0 | validate 3 times, then create 1 order | `timesUsed` = 1 (validate does not count). ⚠️ It is counted even if the order is never paid (see Q4) |
| CPN-019 | Invalid coupon on order | API | P0 | EXPIRED | `POST /api/orders` with `couponCode:"EXPIRED"` | 400 `"This coupon has expired"`; no order; no usage increment |
| CPN-020 | Usage-limit race | API | P2 | coupon limit 1, used 0 | 2 parallel `POST /api/orders` | ⚠️ Today both succeed and `timesUsed` = 2 (the check and the increment are not atomic). Intended: exactly one succeeds |
| CPN-021 | Coupon UI | E2E | P1 | PCT10 | type a lower-case code, Apply; then Remove | input upper-cases; toast "Coupon PCT10 applied! You saved ₹..."; discount line and total update; Remove restores the total |
| CPN-022 | Coupon expires between Apply and Pay | E2E | P2 | coupon valid now; test moves `validTo` into the past after Apply | Pay now | toast `"This coupon has expired"`; no payment started |

> Below-minimum-order coupons: **not implemented** (the `Coupon` model has no minimum-amount field). No case is written for it; see Q4.

### 4.7 Checkout and order creation (CHK)

| ID | Case | Layer | Pri | Preconditions | Steps | Expected |
|---|---|---|---|---|---|---|
| CHK-001 | Empty cart at checkout | E2E | P1 | logged in, empty cart | `/checkout` | "Your cart is empty" with a Shop Products link |
| CHK-002 | Saved default address prefill | E2E | P1 | customerA with 2 addresses, second is default | `/checkout` | default selected; first and last name split from `fullName`; fields filled |
| CHK-003 | Client address validation | E2E | P1 | logged in | Pay now with: no first name; phone "12345"; no line 1, city or state; PIN "6000" | each shows its toast ("Please enter a valid 10-digit Mobile Number", "...6-digit PIN Code", ...); no `POST /api/orders` sent |
| CHK-004 | Order requires login | API | P0 | anonymous | `POST /api/orders` with a valid body | 401; no order row |
| CHK-005 | Order schema validation | API | P0 | customerA | table: `items:[]`; `quantity:0`, `-1`, `1.5`; missing `line1`; `pincode:"12345"`; `phone:"123"`; `email:"bad"` | 400 with a flattened zod error; no order |
| CHK-006 | **Price tampering** | API | P0 | pSesame price 350 | body items with extra `price:1`, `name:"x"`, plus top-level `pricing:{total:1}`, `status:"DELIVERED"`, `paymentStatus:"PAID"` | 200; item price 350 and name from the DB; `pricing.total` = 350×qty; status PENDING / PENDING (extra fields ignored) |
| CHK-007 | Live offer price used | API | P0 | pOffer | order 2 × `v1` | item price 420, total 840 |
| CHK-008 | Inactive or unknown product | API | P0 | pInactive; a random id | order | 400 `"One or more products are unavailable"` |
| CHK-009 | Unknown variant | API | P1 | pSesame | `variantId:"nope"` | 400 `"Variant not found for <name>"` |
| CHK-010 | **Out of stock and quantity limit** | API | P0 | `v1L` stock 10; `v5L` stock 0; `vToggleOff` | qty 11 of `v1L`; qty 1 of `v5L`; qty 1 of `vToggleOff` | 400 `"<name> (<label>) is out of stock"` each; qty 10 of `v1L` succeeds |
| CHK-011 | Order created correctly | API | P0 | customerA, PCT10 | order `v1L` × 2 + coupon | `userId` = session user; status PENDING/PENDING; `stockDecremented:false`; **stock unchanged** (10); `couponCode:"PCT10"`; `pricing={subtotal:700, shipping:0, tax:0, discount:70, total:630}` |
| CHK-012 | `calculatePricing` | Unit | P0 | none | (100,0); (100,150); `pricingFlagsFromLines` | total 100 / shipping 0 / tax 0; total clamps to 0; flags `{taxableSubtotal:0, waiveShipping:true}` (keeps existing tests) |
| CHK-013 | Attribution saved | API | P1 | none | body attribution `{source:"Insta Gram!", campaign:"Diwali 2026", landingPath:"/shop?x=1"}`; then `{landingPath:"/shop"}` only | stored `{source:"insta-gram", campaign:"diwali-2026", landingPath:"/shop"}`; second case stores `attribution:null` (no UTM) |
| CHK-014 | Checkout address auto-saved | API | P1 | customerB with 0 addresses | place 2 orders with the same address, then 1 with a new address | address book has 2 entries; the first is `isDefault:true`; no duplicate (matched on name, phone, line1/2, city, state, PIN, case and space insensitive) |
| CHK-015 | Same variant on two lines | API | P1 | `v1L` stock 10 | items `[v1L×6, v1L×6]` | ⚠️ Intended: 400 (12 > 10). Today each line is checked on its own, so the order passes and payment later fails to reserve stock |
| CHK-016 | Huge quantity on an "available" toggle variant | API | P2 | variant `available:true`, `stock:999` | qty 1000; qty 999 | 400 out of stock; 999 passes |
| CHK-017 | List my orders | API | P0 | orderA_*, orderB_paid | `GET /api/orders` as customerA | only customerA orders, newest first; never orderB |
| CHK-018 | **Happy path, end to end** | E2E | P0 | customerA, fake Cashfree SDK + mock API | PDP, Add to Cart, Cart, Checkout, address, Continue, Review, apply PCT10, Pay now; fake SDK returns to `return_url`; mock says PAID | confirmation shows "Payment confirmed", then redirect to `/profile?tab=orders`; order shows PAID / CONFIRMED; stock decremented once; cart empty |
| CHK-019 | Double click on Pay now | E2E | P2 | as CHK-018 | double click | button shows "Initiating Payment…" and is disabled; only 1 order row |
| CHK-020 | Mobile checkout | E2E | P1 | Playwright mobile project (Pixel 7) | CHK-018 on a phone viewport | same result; nothing blocked by sticky bars |

### 4.8 Payment (PAY)

| ID | Case | Layer | Pri | Preconditions | Steps | Expected |
|---|---|---|---|---|---|---|
| PAY-001 | Create payment, auth and body | API | P0 | none | `POST /api/payment/cashfree` anonymous; logged in with `{}` | 401; 400 `"Invalid orderId"` |
| PAY-002 | Credentials missing | API | P1 | unset `CASHFREE_APP_ID` | call | 503 with the "Cashfree credentials are not configured..." message |
| PAY-003 | **IDOR on create payment** | API | P0 | orderB_pending | customerA calls with orderB's id; unknown id | 403 `"Forbidden"`, `cashfreeOrderId` untouched; 404 |
| PAY-004 | Create payment success | API | P0 | orderA_pending total 630; MSW captures the request | call | 200 `{paymentSessionId, cashfreeOrderId, mode:"sandbox", orderId}`; Cashfree body: `order_amount:630`, `INR`, `customer_phone` = last 10 digits of the address phone, `return_url = <site>/orders/<id>/confirmation?order_id={order_id}`, `notify_url = <site>/api/payment/cashfree/webhook`; DB `cashfreeOrderId` matches `^HG-.{10}-\d{6}$`; headers carry `x-client-id`, `x-client-secret`, `x-api-version` |
| PAY-005 | Cashfree returns an error | API | P1 | MSW 400 `{message:"bad phone"}` | call | 502 `{error:"bad phone"}`; ⚠️ `cashfreeOrderId` already overwritten |
| PAY-006 | Paying a non-payable order | API | P0 | orders PAID, REFUNDED, CANCELLED | call create payment | ⚠️ Intended: 409/400. Today a new Cashfree order is created, so an already-paid order can be charged again |
| PAY-007 | Retrying payment loses the first session | API | P0 | create payment twice (ids X then Y); a webhook SUCCESS for **X** | post a signed webhook for X | ⚠️ Intended: the order is marked PAID. Today the webhook returns 404 (`cashfreeOrderId` is Y), so the money is captured and the order stays PENDING |
| PAY-008 | `resolveSiteUrl` | Unit | P1 | none | headers: `x-forwarded-host+proto`; `host: abc.ngrok-free.app`; `host: localhost:3000`; none | `https://fwd`, `https://abc...`, `http://localhost:3000`, `NEXT_PUBLIC_SITE_URL` fallback; trailing `/` trimmed |
| PAY-009 | Env helpers | Unit | P1 | none | `CASHFREE_ENV` = `production`, `PRODUCTION`, unset, junk; `CASHFREE_API_VERSION` unset | host and mode resolve correctly (anything not PRODUCTION means sandbox); version defaults to `2023-08-01` |
| PAY-010 | `createCashfreePayment` error mapping | Unit | P1 | stub `fetch` | `{error:{message}}`, `{message}`, `{code}`, a 200 without `payment_session_id`, `fetch` throws | the message is picked in that order; the fallback is `"Payment initiation failed"` |
| PAY-011 | `getCashfreeOrderStatus` | Unit | P1 | stub `fetch` | `order_status` PAID / ACTIVE; `fetch` throws | `success:true` and `paymentId` = `cf_order_id`; false; `state:"ERROR"` |
| PAY-012 | Status endpoint, auth and ownership | API | P0 | orderB_pending | anonymous; no `cashfreeOrderId`; unknown id; customerA on B's id; admin on B's id | 401; 400; 404; 403; 200 |
| PAY-013 | Status PAID | API | P0 | orderA_pending, MSW PAID | `POST /api/payment/cashfree/status` | 200 `{paymentStatus:"PAID", state:"PAID"}`; order CONFIRMED; stock decremented; emails called once |
| PAY-014 | Status EXPIRED / TERMINATED / ACTIVE | API | P0 | as above | each state | FAILED, FAILED, unchanged PENDING |
| PAY-015 | `verifyCashfreeWebhookSignature` | Unit | P0 | secret `test_secret` | valid signature; body changed by 1 byte; different timestamp; wrong secret; missing headers; secret env empty; signature of a different length | ok; then all fail with `"Invalid payment webhook signature"`, with no exception thrown |
| PAY-016 | **Webhook bad signature** | API | P0 | orderA_pending | POST a SUCCESS body with no or a wrong signature | 401; order unchanged; stock unchanged |
| PAY-017 | Webhook SUCCESS | API | P0 | orderA_pending (cart `v1L` × 2) | signed `{type:"PAYMENT_SUCCESS_WEBHOOK", data:{order:{order_id}, payment:{cf_payment_id:123, payment_status:"SUCCESS"}}}` | 200 `{ok:true}`; PAID / CONFIRMED; `cashfreePaymentId:"123"`; `stockDecremented:true`; `v1L` stock 8; customer and admin emails called once each |
| PAY-018 | **Duplicate webhook (idempotent)** | API | P0 | PAY-017 done | send the identical webhook 3 more times | 200 each; stock still 8; no extra emails; `updatedAt` may change but the state does not |
| PAY-019 | Webhook FAILED / USER_DROPPED | API | P0 | orderA_pending | signed `PAYMENT_FAILED_WEBHOOK`; `PAYMENT_USER_DROPPED_WEBHOOK`; `payment_status:"FAILED"` | paymentStatus FAILED; status stays PENDING; stock unchanged |
| PAY-020 | Failed webhook after success | API | P0 | order PAID via webhook | signed FAILED webhook for the same order (Cashfree sends one per failed attempt, possibly late) | ⚠️ Intended: stays PAID. Today it is overwritten to FAILED while the order is CONFIRMED and stock is decremented |
| PAY-021 | Webhook bad payloads | API | P1 | valid signature | no `order_id`; unknown `order_id`; body `"not json"` | 400 `"Invalid webhook"`; 404; 500 |
| PAY-022 | Webhook amount mismatch | API | P1 | orderA total 630 | signed SUCCESS with `payment_amount:1` | ⚠️ Intended: reject or flag. Today it is marked PAID (amount not checked) |
| PAY-023 | Webhook replay | API | P2 | captured valid webhook with a timestamp 2 days old | replay | ⚠️ Accepted today (no timestamp window). Harmless only while the handler is idempotent (PAY-018). Decide whether to add a 5-minute window |
| PAY-024 | **Concurrent mark-paid** | API | P1 | orderA_pending | `Promise.all([webhook SUCCESS, status PAID, markOrderPaid()])`, which is what happens when the user returns from Cashfree: the confirmation page, the client `CashfreeStatusSync` and the webhook all fire together | Intended: stock decremented once and one email pair. ⚠️ Today `markOrderPaid` reads `wasPaid` and then updates with no lock or conditional update, so a double decrement and double emails are possible |
| PAY-025 | `markOrderPaid` unknown id | API | P1 | none | call | returns `null`; no throw |
| PAY-026 | Stock gone by payment time | API | P0 | order A for `v1L` × 10 (PENDING); order B for `v1L` × 10 paid first | webhook SUCCESS for A | ⚠️ Intended: a defined outcome (e.g. PAID + flagged "oversold" + admin email, or auto-refund). Today it throws, the webhook returns 500 (Cashfree keeps retrying) and A stays PENDING although charged |
| PAY-027 | Partial stock failure rolls back | API | P1 | order with pSesame `v1L` ×1 and `v5L` ×1 (stock forced to 0 after ordering) | `markOrderPaid` | throws; `v1L` stock **unchanged** (transaction rolled back) |
| PAY-028 | Customer cancels at Cashfree | E2E | P0 | as CHK-018, fake SDK returns, mock state `EXPIRED` | finish | confirmation shows "Payment failed. You can retry from checkout."; order FAILED; stock unchanged |
| PAY-029 | Cart after a failed payment | E2E | P1 | PAY-028 | go to `/cart` | ⚠️ Cart is empty (cleared before the redirect) and there is no "retry payment" for the existing order. Decide: keep the cart until PAID, or add retry |
| PAY-030 | Payment still pending | E2E | P2 | mock state stays `ACTIVE` | wait for the 4 retries (0 / 1.5 / 3 / 5 s) | message "Payment is still pending confirmation. Check My Orders in a moment." |

### 4.9 Orders and confirmation (ORD)

| ID | Case | Layer | Pri | Preconditions | Steps | Expected |
|---|---|---|---|---|---|---|
| ORD-001 | Order detail API auth | API | P0 | none | anonymous `GET /api/orders/[id]` | 401 |
| ORD-002 | **IDOR on order API** | API | P0 | orderA_paid | owner; customerB; admin; unknown id | 200; **403**; 200; 404 |
| ORD-003 | **IDOR on order pages** | E2E | P0 | customerB logged in | open `/orders/<A id>`, `/orders/<A id>/confirmation`, `/orders/<A id>/tracking` | each renders 404; no A data (name, address) in the HTML |
| ORD-004 | Confirmation needs login | E2E | P0 | anonymous | open `/orders/<id>/confirmation` | redirect to `/login?callbackUrl=%2Forders%2F<id>%2Fconfirmation` |
| ORD-005 | Confirmation server-side sync | API/E2E | P0 | orderA_pending + mock PAID | render the confirmation page | the page calls `markOrderPaid`; shows "confirmed"; the client then redirects to `/profile?tab=orders` |
| ORD-006 | Admin opens a customer's PAID confirmation | E2E | P2 | admin | open the URL | redirected to `/profile?tab=orders` (current behaviour; confirm intended) |
| ORD-007 | Purchase event fires once | E2E | P1 | CHK-018 | inspect `window.dataLayer`; reload the confirmation | exactly 1 `purchase` with `transaction_id` = order id and value = total |
| ORD-008 | Order history | E2E | P1 | orderA_* | `/orders` and `/profile?tab=orders` | lists only A's orders with status badges |
| ORD-009 | Order detail page | E2E | P1 | orderA_paid | open | `Order #VSO-XXXXXX` (last 6, upper case); PAID badge; item lines, totals, address; estimated delivery (not when DELIVERED) |
| ORD-010 | Delivered order review prompts | E2E | P1 | orderA_delivered with 2 products, 1 already reviewed | open | review form only for the unreviewed product |
| ORD-011 | `getDeliveredReviewTargets` | API | P2 | items with duplicate productIds and a deleted product | call | deduped; deleted product dropped; `reviewedIds` correct |
| ORD-012 | Estimated delivery | Unit | P2 | existing `delivery.test.ts` | keep; add an invalid date and a string base date | invalid date falls back to now; IST formatting |
| ORD-013 | Order emails recipient | Unit | P1 | mock `sendBrevoEmail` | `sendOrderConfirmationEmail` with and without `shippingAddress.email`; `sendAdminNewOrderEmail` with and without `ADMIN_NOTIFY_EMAIL` | sent to the shipping email; without it, console only. ⚠️ The account email is never used (see Q10) |
| ORD-014 | Email HTML escaping | Unit | P1 | none | `renderEmailHtml` with name `<script>x</script>` | escaped (`&lt;script&gt;`) in every slot |
| ORD-015 | Status-change email | Unit | P2 | none | `sendOrderStatusEmail(order,"SHIPPED")` with a tracking number | subject from `EMAIL_COPY.statusSubject`; includes the courier and AWB; no ETA row for DELIVERED or CANCELLED |

### 4.10 Customer order tracking (TRK)

| ID | Case | Layer | Pri | Preconditions | Steps | Expected |
|---|---|---|---|---|---|---|
| TRK-001 | Tracking API auth and IDOR | API | P0 | orderA_shipped | anonymous; customerB; admin; unknown | 401; 403; 200; 404 |
| TRK-002 | Not shipped yet | API | P1 | orderA_paid (no AWB) | GET | 404 `"This order has not been shipped yet"` |
| TRK-003 | Live status | API | P0 | MSW ST Courier "in transit" fixture | GET | 200 with `trackingNumber`, `courier:"ST Courier"`, `status`, `events[]` (newest first), `summary.origin/destination`, ISO `fetchedAt`; DB `trackingStatus` and `trackingLastCheckedAt` set |
| TRK-004 | 10-minute cache | API | P1 | TRK-003 done | GET again within 10 min (fake timers); then +11 min | 2nd call makes no ST Courier request and no DB update; after 11 min it fetches again |
| TRK-005 | ST Courier down | API | P1 | MSW: no `set-cookie`; `{code:500}`; timeout over 15 s | GET | 502 `"Couldn't load live status right now"` |
| TRK-006 | Delivered transition | API | P0 | "delivered" fixture; order SHIPPED, then the same for an order CONFIRMED with an AWB | GET | SHIPPED becomes DELIVERED; CONFIRMED stays CONFIRMED (only SHIPPED moves) |
| TRK-007 | `parseStCourierResultPage` | Unit | P0 | HTML fixtures | parse each | summary fields (including the `Orgin Src` spelling); event pairs; `delivered` true only when status starts with "Delivered"; page with no status returns `null`; `raw` ≤ 1000 chars |
| TRK-008 | `normalizeConsignment` | Unit | P0 | none | `"58240292331"`, `" 58240292331 "`, `"5824029233"`, `"5824029233a"`, `123` | valid, trimmed valid, null, null, null |
| TRK-009 | Cache eviction | Unit | P2 | none | insert 501 AWBs (mock fetch) | size stays ≤ 500; the oldest entry is evicted |
| TRK-010 | Tracking page | E2E | P1 | orderA_shipped with mocked status; orderA_paid | open `/orders/<id>/tracking` | timeline renders; an unshipped order shows the not-shipped message |

### 4.11 Reviews (REV)

| ID | Case | Layer | Pri | Preconditions | Steps | Expected |
|---|---|---|---|---|---|---|
| REV-001 | Public list | API | P1 | approved and pending reviews | `GET /api/reviews`; `?productId=` | 400 `"productId required"`; approved only, newest first |
| REV-002 | Submit review | API | P0 | none | `POST /api/reviews {productId, authorName:"Anu", rating:5, body:"Great"}` | 200, `isApproved:false`; not in the public list; product `reviewCount` unchanged (approved only) |
| REV-003 | Verified purchase flag | API | P1 | customerA has a PAID order with pSesame | post as customerA; as customerB; as anonymous | `isVerified` true, false, false; `userId` set for logged-in users |
| REV-004 | Validation | API | P1 | none | rating 0 and 6; authorName "A"; body " a " | 400 |
| REV-005 | Fractional rating | API | P1 | none | rating 4.5 | ⚠️ Intended: 400. Today zod allows it and the Prisma `Int` column throws a 500 |
| REV-006 | Unknown product | API | P2 | none | random productId | ⚠️ Intended: 404/400. Today 500 (foreign key error) |
| REV-007 | Anonymous / repeat reviews | API | P2 | none | 5 reviews from the same user for the same product | ⚠️ All accepted (no login, no per-user limit). Decide the policy (Q7) |
| REV-008 | Stats recalculation | API | P1 | ratings 5, 4, 4 approved and 1 pending | `recalculateProductReviewStats` | `averageRating:4.3`, `reviewCount:3`; with none approved, 0 and 0 |
| REV-009 | Review lifecycle | E2E | P1 | customerA | submit on the PDP; admin approves in `/admin/reviews`; reload the PDP | thanks toast; after approval it is visible with stars; average updated |
| REV-010 | Review from a delivered order | E2E | P2 | orderA_delivered | submit from the order page | review created; the form for that product disappears on reload |

### 4.12 Profile, addresses and password (PRF)

| ID | Case | Layer | Pri | Preconditions | Steps | Expected |
|---|---|---|---|---|---|---|
| PRF-001 | Get profile | API | P0 | customerA | anonymous; logged in | 401; 200 with `name, email, phone, role, addresses`; **no `passwordHash` or reset fields** |
| PRF-002 | Update profile | API | P0 | customerA | `PUT {name:"New Name", phone:"99", email:"x@y.z", role:"admin"}`; `{name:"A"}` | 200: only name and phone change; email and role unchanged; second call 400 |
| PRF-003 | Change password | API | P0 | customerA; googleUser | wrong current; new password 5 chars; correct; googleUser | 400 "Current password is incorrect"; 400; 200 and the new password works while the old fails; 400 "only available for email accounts" |
| PRF-004 | Address API needs auth | API | P0 | anonymous | GET / POST / PUT / DELETE `/api/user/addresses` | 401 each |
| PRF-005 | Add address and defaults | API | P1 | customerB, no addresses | POST A1 (no `isDefault`); POST A2 `isDefault:true` | A1 becomes default; then A2 default and A1 not |
| PRF-006 | Update by index | API | P1 | 2 addresses | PUT `index:1`; `index:5`; `index:-1`; `index:"1"`; invalid PIN | 200; 400 "out of bounds"; 400 "Invalid address index" ×2; 400 "Validation failed" |
| PRF-007 | Delete by index | API | P1 | 2 addresses, index 0 default | DELETE `?index=0`; `?index=9`; `?index=abc`; no index | remaining address promoted to default; 400; 400; 400 |
| PRF-008 | Address isolation | API | P0 | A and B each have addresses | as A: PUT/DELETE index 0 | only A's list changes; B's identical |
| PRF-009 | Profile tabs | E2E | P1 | customerA | `/profile?tab=orders` / `addresses` / `password`; click tabs | correct tab active; URL updates `?tab=` |
| PRF-010 | Address manager UI | E2E | P1 | customerA | add, edit, set default, delete | the list reflects each change after reload |
| PRF-011 | Change password UI | E2E | P2 | customerA | submit the form | success toast; re-login with the new password works |

### 4.13 Contact (CON)

| ID | Case | Layer | Pri | Preconditions | Steps | Expected |
|---|---|---|---|---|---|---|
| CON-001 | Valid message | API | P0 | mock `sendContactFormEmail`; `startedAt = now − 5 s` | `POST /api/contact` | 200 with the thanks message; email called with a trimmed name and lower-case email |
| CON-002 | Validation | API | P1 | none | name 1 / 101 chars; bad email; message 9 / 2001 chars; phone 21 chars | 400 |
| CON-003 | Honeypot | API | P1 | none | `website:"http://spam"` | 200 fake ok; email **not** called |
| CON-004 | Filled too fast | API | P1 | none | no `startedAt`; `startedAt = now − 1 s` | 200 fake ok; no email |
| CON-005 | Spam heuristics | Unit/API | P1 | none | name `gKzyAVwNDARbWPeSpHZl`; message `98765 43210 123`; message `!!!!!!!!!!!!`; email `a.b.c.d@gmail.com` | each gives a fake ok and no email; a normal Tamil-script message **is** sent (`\p{L}`) |
| CON-006 | Rate limit | API | P1 | fresh module | 4 valid posts with `x-forwarded-for: 1.2.3.4` | first 3 are 200; 4th 429 "Too many messages..."; a different IP is still allowed |
| CON-007 | Email failure | API | P2 | `sendContactFormEmail` rejects | post | 500 with an error message |
| CON-008 | Contact UI | E2E | P2 | none | fill the form, wait 3 s, submit | thanks message |

### 4.14 Analytics and attribution (ANL)

| ID | Case | Layer | Pri | Preconditions | Steps | Expected |
|---|---|---|---|---|---|---|
| ANL-001 | `sanitizeToken` | Unit | P0 | none | `" Insta Gram!! "`, `"---a---"`, 200-char input, `""` | `insta-gram`, `a`, 120 chars, `undefined` |
| ANL-002 | `sanitizePath` | Unit | P0 | none | `/shop?x=1`, `shop`, `/a b`, `/<script>`, 201 chars | `/shop`, then `undefined` for the rest |
| ANL-003 | `normalizeAttribution` | Unit | P0 | none | only `landingPath`; `source` only; null | null; object; null |
| ANL-004 | Fingerprint and search params | Unit | P2 | none | `attributionFromSearchParams(?utm_source=yt&utm_medium=short, "/")` and `visitFingerprint` | normalized object; pipe-joined key |
| ANL-005 | Stored attribution TTL | Unit (jsdom) | P2 | stored `capturedAt` 31 days ago | `readStoredAttribution()` | null and the key removed; at 29 days it returns the value |
| ANL-006 | Visits endpoint | API | P1 | none | valid; `sessionKey` 7 chars; no UTM; exact duplicate; 31st distinct visit in a session | create; 400; 400; 200 no new row (P2002); 200 no new row (limit 30) |
| ANL-007 | WhatsApp clicks endpoint | API | P1 | none | guest valid; logged-in valid; `context:"home"`; `items:[]`; `quantity:1000`; 41st click in a session | `status:"NEW"`; user id, name and email attached; 400; 400; 400; silently ignored |
| ANL-008 | UTM capture in the browser | E2E | P2 | none | open `/?utm_source=instagram&utm_campaign=diwali`; navigate around | exactly 1 `POST /api/analytics/visits`; `localStorage["healargo.attribution"]` set |
| ANL-009 | Attribution carried to the order | E2E | P2 | ANL-008 then checkout (CHK-018) | inspect the order | `order.attribution.source = "instagram"` |
| ANL-010 | Label helpers | Unit | P2 | none | `formatSourceLabel("youtube"/"my_src"/undefined)`, `formatConversionRate(0,1)/(200,3)`, `formatAttributionLine` | `YouTube`/`My Src`/`Direct`; `—`/`1.5%`; joined with ` · ` |
| ANL-011 | Traffic report aggregation | API | P1 | visits and orders across 2 sources, PAID and PENDING | `getTrafficReport()` (report.ts) | per source and campaign: visits, orders, paidOrders, revenue (PAID only); summary excludes `direct`; sorted by revenue, then orders, then visits |
| ANL-012 | PostHog wrappers | Unit (jsdom) | P2 | no token | `initPostHog()`, `capturePostHogEvent`, `identifyPostHogUser`, `resetPostHogUser` | null; nothing throws |
| ANL-013 | `trackPurchase` dedupe | Unit (jsdom) | P1 | none | call twice with the same id; once with `value:NaN`; once with id `"  "` | 1 gtag `purchase` and 1 PostHog `order_completed`; the NaN and blank calls are ignored |

### 4.15 Admin: dashboard (ADM-DSH)

| ID | Case | Layer | Pri | Preconditions | Steps | Expected |
|---|---|---|---|---|---|---|
| ADM-DSH-001 | Stat cards | E2E | P1 | std world (known counts; PAID totals 630 + 1300) | admin opens `/admin/dashboard` | Orders = all orders; Products = all (including inactive); Users = all; Revenue = Σ **PAID** totals only (excludes PENDING, FAILED, REFUNDED) |
| ADM-DSH-002 | Recent orders | E2E | P2 | 7 orders | open | 5 newest, newest first, each linking to the admin order detail |
| ADM-DSH-003 | Out-of-stock widget | API | P1 | 15 active products; the **oldest** has a stock-0 variant | `getOutOfStockProducts()` | ⚠️ Intended: listed. Today only the 12 newest products are checked, so it is missed. Max 5 rows |
| ADM-DSH-004 | Empty state | E2E | P2 | DB without visits or orders | open | renders with zeros and no crash (traffic sources card included) |

### 4.16 Admin: products (ADM-PRD)

| ID | Case | Layer | Pri | Preconditions | Steps | Expected |
|---|---|---|---|---|---|---|
| ADM-PRD-001 | Create product | API | P0 | admin | `POST /api/products` with name "Groundnut Oil", HTML description, 2 variants without `_id` | 200; slug `groundnut-oil`; each variant gets a UUID `_id`; `revalidatePath("/","layout")`, `/shop`, `/bestsellers` called |
| ADM-PRD-002 | Create validation | API | P0 | admin | name "G"; description `"<p> </p>"`; `variants:[]`; variant missing `sku`; no `categoryId` | 400 flattened zod error each |
| ADM-PRD-003 | Duplicate slug | API | P1 | pSesame | create with the same name | ⚠️ Intended: 409 with a clear message. Today 500 (unique constraint) |
| ADM-PRD-004 | Negative price or stock | API | P1 | admin | variant `price:-10`, `stock:-5` | ⚠️ Intended: 400. Today accepted (no `min`) |
| ADM-PRD-005 | Edit and slug regeneration | API | P1 | pSesame | `PUT /api/products/[id] {name:"Sesame Oil Premium"}` without a slug | 200; slug becomes `sesame-oil-premium` ⚠️ (old product URLs, shared links and the sitemap change; decide whether to keep the slug) |
| ADM-PRD-006 | PUT accepts the raw body | API | P2 | pSesame | `PUT {averageRating:5, reviewCount:999}`; `PUT {foo:1}` | ⚠️ Today the first is written (mass assignment) and the second gives a 500. Intended: zod-validate the update like POST |
| ADM-PRD-007 | Variant ids preserved on edit | API | P0 | pSesame in carts and orders | PUT variants keeping `_id` plus 1 new variant | existing `_id`s unchanged (carts and orders keep matching); the new variant gets an id |
| ADM-PRD-008 | Edit unknown id | API | P2 | admin | PUT a random id | 404 |
| ADM-PRD-009 | Delete product | API | P1 | product with no orders; pSesame referenced by order items | DELETE each | 200 and gone; ⚠️ the second gives 500 (foreign key from `order_items`). Intended: friendly 409 or soft-delete (`isActive:false`) |
| ADM-PRD-010 | Offer window fields | API | P2 | pOffer | PUT `offerStartsAt:null, offerEndsAt:null` | cleared; `offerIsLive` becomes false; `/offers` no longer lists it |
| ADM-PRD-011 | Create through the UI | E2E | P0 | admin | `/admin/products/new`, fill name, rich-text description, category, 2 variants, paste an image URL, save | toast; product listed in `/admin/products`; visible on `/shop` and its PDP with correct prices |
| ADM-PRD-012 | Edit price through the UI | E2E | P1 | admin | change the `v1L` price to 360, save | PDP shows ₹360 straight away (revalidation) |
| ADM-PRD-013 | Deactivate | E2E | P1 | admin | toggle Active off | removed from `/shop`; PDP returns 404 |
| ADM-PRD-014 | Image URL rule | E2E | P2 | admin | paste `ftp://x` / `not a url` | toast "Enter a valid image URL..." |
| ADM-PRD-015 | Admin list search, filter and paging | Unit (jsdom) | P2 | 30 items | `renderHook(useAdminList)`; set query, filter, page size; go to page 3 then filter down to 1 page | filtered counts, `from`/`to` correct; page resets to 1 on query change and clamps when `pageCount` shrinks |

### 4.17 Admin: categories (ADM-CAT)

| ID | Case | Layer | Pri | Preconditions | Steps | Expected |
|---|---|---|---|---|---|---|
| ADM-CAT-001 | Create | API | P1 | admin | `POST /api/categories {name:"Oil Cakes"}`; `{name:"O"}` | 200 with slug `oil-cakes` and `sortOrder 0`; 400 |
| ADM-CAT-002 | Update | API | P1 | catOils | PUT a new name without a slug; unknown id | slug regenerated; 404 |
| ADM-CAT-003 | Delete | API | P1 | empty category; catOils with products | DELETE each | 200; ⚠️ 500 (products reference it). Intended: 409 "category has products" |
| ADM-CAT-004 | Inactive category hidden | E2E | P1 | admin deactivates catOils | open `/categories/wood-pressed-oils`, the home strip, `sitemap.xml` | not shown and not in the sitemap; its products remain at `/shop` (decide) |
| ADM-CAT-005 | Category UI CRUD | E2E | P2 | admin | create, edit, delete in `/admin/categories` | list updates; delete confirm dialog shown |

### 4.18 Admin: combos (ADM-CMB)

| ID | Case | Layer | Pri | Preconditions | Steps | Expected |
|---|---|---|---|---|---|---|
| ADM-CMB-001 | Create | API | P0 | admin | `POST /api/combos` with name `"<b>Family Pack</b>"`, price 999, originalPrice 1200, items: 1 product+variant and 1 custom `{isCustom:true, productName:"Wooden Spoon", customPrice:50}` | 200; slug `family-pack`; items stored as sent; dates null |
| ADM-CMB-002 | Validation messages | API | P1 | admin | name `"<p>A</p>"`; price 0; originalPrice −1; `items:[]`; item with neither variant nor name | 400 with `path: message` details, e.g. `"price: Combo price must be greater than 0"` |
| ADM-CMB-003 | Duplicate name | API | P2 | comboLive | create the same name | ⚠️ 500 (slug unique). Intended: 409 or a suffix |
| ADM-CMB-004 | Update | API | P1 | comboLive | PUT `{startsAt:"garbage", endsAt:""}`; PUT `{price:-5}` | dates become null; ⚠️ negative price accepted (PUT is not validated) |
| ADM-CMB-005 | Delete while in carts | API+E2E | P2 | combo in a customer cart | delete, then the customer pays | 400 "One or more products are unavailable" shown at checkout |
| ADM-CMB-006 | Combo builder UI | E2E | P1 | admin | `/admin/combos/new` (loads `/api/products?active=false`), pick products and variants, add a custom line, set the window, save | listed in `/admin/combos`; live on `/combos` when inside the window |

### 4.19 Admin: coupons (ADM-CPN)

| ID | Case | Layer | Pri | Preconditions | Steps | Expected |
|---|---|---|---|---|---|---|
| ADM-CPN-001 | List and stats | API | P1 | coupons seeded | `GET /api/admin/coupons` | `data[]` newest first; `stats.total`, `active` (ACTIVE and not expired), `expired`, `totalRedemptions` = Σ `timesUsed` |
| ADM-CPN-002 | Create | API | P0 | admin | POST `{code:" diwali25 ", name:"Diwali", discountValue:25, validFrom, validTo}` | 201; code `DIWALI25`; defaults PERCENTAGE / ACTIVE / `usageLimit 0` / `timesUsed 0` |
| ADM-CPN-003 | Duplicate code | API | P0 | PCT10 | create `pct10` | 400 "A coupon with this code already exists" |
| ADM-CPN-004 | Validation | API | P1 | admin | code "A"; discountValue −1; usageLimit 1.5; missing validFrom | 400 with the first issue message |
| ADM-CPN-005 | Unsafe values | API | P1 | admin | PERCENTAGE 150; `validTo < validFrom`; `validFrom:"not-a-date"` | ⚠️ Intended: 400 for each. Today the first two are accepted and the third gives a 500 (Invalid Date) |
| ADM-CPN-006 | Update | API | P1 | PCT10, FLAT50 | PUT FLAT50 `{code:"PCT10"}`; PUT `{status:"INACTIVE"}`; unknown id | 400 "Another coupon with this code already exists"; 200; 404 "Coupon not found" |
| ADM-CPN-007 | Delete | API | P1 | PCT10 | DELETE; DELETE again | 200 `{success:true}`; 404 |
| ADM-CPN-008 | Coupon UI to checkout | E2E | P1 | admin, then customer | create a coupon restricted to pSesame in the modal; the customer applies it with pSesame and pOffer in the cart | discount only on pSesame lines |

### 4.20 Admin: orders (ADM-ORD)

| ID | Case | Layer | Pri | Preconditions | Steps | Expected |
|---|---|---|---|---|---|---|
| ADM-ORD-001 | Orders list filter | E2E | P1 | orders in every paymentStatus | `/admin/orders` | only PAID and REFUNDED shown; search and filters work |
| ADM-ORD-002 | Admin-created order visibility | E2E | P1 | admin | create an order with default statuses through "Add order" | ⚠️ Intended: visible. Today PENDING orders are hidden from the list, so the new order "disappears" |
| ADM-ORD-003 | Create order (API) | API | P0 | admin | `POST /api/admin/orders` with address and items `v1L × 2`, notes | 200; prices from the catalog (700); `userId:null`; no coupon; PENDING/PENDING; stock unchanged |
| ADM-ORD-004 | Create order as PAID | API | P1 | admin | same with `paymentStatus:"PAID", status:"CONFIRMED"` | ⚠️ Stock **not** decremented and `stockDecremented:false` (bypasses `markOrderPaid`). Intended: decrement, or document it as offline stock |
| ADM-ORD-005 | Create validation and stock | API | P1 | admin | missing address; quantity 0; `v5L` (stock 0) | 400 `"Please check the form and try again"` each (the stock error message is replaced by the generic one) |
| ADM-ORD-006 | Status change and email | API | P0 | orderA_paid CONFIRMED; mock `sendOrderStatusEmail` | PATCH `{id, status:"PROCESSING"}`; PATCH the same status again | 200, email called once with "PROCESSING"; second PATCH sends no email |
| ADM-ORD-007 | Mark PAID manually | API | P0 | orderA_pending | PATCH `{id, paymentStatus:"PAID", notes:"cash"}` twice | PAID / CONFIRMED; stock decremented **once**; notes saved; confirmation emails once |
| ADM-ORD-008 | Cancel via PATCH | API | P1 | paid order with stockDecremented | PATCH `{status:"CANCELLED"}` | status CANCELLED; ⚠️ stock not restored and payment still PAID (only the refund endpoint restores). Decide |
| ADM-ORD-009 | REFUNDED via PATCH | API | P1 | paid order | PATCH `{paymentStatus:"REFUNDED"}` | ⚠️ marked REFUNDED with no stock restore and `stockDecremented` still true; a later Refund click then returns early. Intended: route it through the refund logic |
| ADM-ORD-010 | PATCH validation | API | P2 | admin | `status:"LOST"`; unknown id; `paymentStatus:"PAID"` with an unknown id | 400; 404; ⚠️ 200 `{data:null}` |
| ADM-ORD-011 | Tracking via PATCH bypasses rules | API | P2 | unpaid order | PATCH `{trackingNumber:"abc"}` | ⚠️ accepted (no 11-digit or paid-only check, unlike the tracking PUT). Decide whether PATCH should strip these fields |
| ADM-ORD-012 | **Refund** | API | P0 | orderA_paid (`v1L` × 2, stock 8) | `POST /api/admin/orders/[id]/refund` | 200; REFUNDED / CANCELLED; `stockDecremented:false`; `v1L` stock back to 10 |
| ADM-ORD-013 | Refund idempotent | API | P0 | ADM-ORD-012 done | refund again | 200 returning the same order; stock still 10 (no double restore) |
| ADM-ORD-014 | Refund semantics | API | P1 | orderA_pending (never paid) | refund | ⚠️ Marked REFUNDED although nothing was charged, and no Cashfree refund API is called in either case (Q5) |
| ADM-ORD-015 | Refund unknown id | API | P2 | admin | refund a random id | 404 "Order not found" |
| ADM-ORD-016 | Delete order | API | P1 | paid order | `DELETE /api/admin/orders/[id]`; again | 200 and the items are cascaded away; second call 404. ⚠️ Stock is not restored for a paid order |
| ADM-ORD-017 | **Add tracking** | API | P0 | orderA_paid CONFIRMED; orderA_pending | PUT `.../tracking` with `"5824029233"` (10 digits); valid AWB on the pending order; AWB already used by orderA_shipped; valid new AWB | 400 "must be exactly 11 digits"; 400 "only for paid orders"; 409 "already used on another order"; 200: `courier:"ST Courier"`, status SHIPPED, `shippedAt` set, `trackingStatus` reset |
| ADM-ORD-018 | Tracking on a delivered order | API | P2 | orderA_delivered | PUT a new AWB | AWB updated; status stays DELIVERED; `trackingStatus` and `LastCheckedAt` reset because the AWB changed |
| ADM-ORD-019 | Tracking GET and DELETE | API | P1 | orderA_shipped | GET; DELETE; DELETE an unknown id | payload; tracking fields null (status stays SHIPPED); 404 |
| ADM-ORD-020 | Tracking sync | API | P1 | orderA_shipped; order without an AWB | POST `.../tracking/sync` (MSW delivered); POST for the no-AWB order | 200 `{ok:true, delivered:true}` and the order becomes DELIVERED, bypassing the cache (`force`); 502 |
| ADM-ORD-021 | Order detail UI | E2E | P0 | admin, orderA_paid | change the status to PROCESSING, add AWB `58240292331`, Sync, then Refund (accept "Refund this order and restore stock?") | each toast; the badges update; tracking card shows the ST Courier status; final REFUNDED / CANCELLED |
| ADM-ORD-022 | Detail extras | E2E | P2 | order with attribution | open | estimated delivery range and the attribution line shown |
| ADM-ORD-023 | Create order UI | E2E | P2 | admin | "Add order" form: pick a product and variant, address, save | toast; record exists (also see ADM-ORD-002) |

### 4.21 Admin: users (ADM-USR)

| ID | Case | Layer | Pri | Preconditions | Steps | Expected |
|---|---|---|---|---|---|---|
| ADM-USR-001 | List users | API | P0 | std world | `GET /api/admin/users` | all users newest first; fields `id, name, email, phone, image, role, createdAt`; **no `passwordHash` or reset token** |
| ADM-USR-002 | Create user | API | P1 | admin | POST user; POST with `role:"admin"`; duplicate email; invalid | 200 user; 200 admin; 409 "Email already registered"; 400 |
| ADM-USR-003 | Change role (PATCH) | API | P0 | admin, admin2, customerA | (a) own id; (b) demote admin2 while 2 admins exist; (c) last admin: the DB has admin2 as the **only** admin and the mocked session is `admin` (a stale JWT, see AUTH-037), then demote admin2; (d) unknown id; (e) promote customerA | (a) 400 "You cannot change your own role"; (b) 200; (c) 400 "Cannot demote the last admin"; (d) 404; (e) 200 |
| ADM-USR-004 | Edit user (PUT) | API | P1 | admin, customerA | email → customerB's (any case); new password; own role change; last-admin demotion | 409; bcrypt rehashed and login works; 400; 400 |
| ADM-USR-005 | Delete user | API | P1 | customerA with orders and reviews | delete self; delete the last admin; delete customerA | 400 "You cannot delete your own account"; 400 "Cannot delete the last admin"; 200: orders and reviews **kept** with `userId:null` (SetNull) and still visible to the admin |
| ADM-USR-006 | Users UI | E2E | P2 | admin | add, edit, change role, delete in `/admin/users` | table updates; guarded actions show error toasts |

### 4.22 Admin: reviews (ADM-REV)

| ID | Case | Layer | Pri | Preconditions | Steps | Expected |
|---|---|---|---|---|---|---|
| ADM-REV-001 | Approve and unapprove | API | P0 | 1 pending review (rating 5) on pSesame with 2 approved (4, 4) | PATCH `{id, isApproved:true}`; then false; unknown id; `{id}` only | `averageRating` 4.3 and `reviewCount` 3; back to 4.0 and 2; 404; 400 |
| ADM-REV-002 | Delete | API | P1 | approved review | DELETE `{id}`; DELETE an unknown id; DELETE `{}` | stats recalculated; 200 ok (silent); 400 |
| ADM-REV-003 | Moderation UI | E2E | P2 | pending reviews | approve and delete in `/admin/reviews` | list and badges update |

### 4.23 Admin: carousels (ADM-CAR)

| ID | Case | Layer | Pri | Preconditions | Steps | Expected |
|---|---|---|---|---|---|---|
| ADM-CAR-001 | `carouselSchema` | Unit | P0 | none | imageUrl `/banner.png`, `https://x/y.jpg`, `ftp://x`, `""`; navigationLink `/shop`, `https://x`, `javascript:alert(1)`, `JavaScript:...`, `data:text/html,..`, `vbscript:`, `shop`; sortOrder `"2"`, 0, 1.5 | valid, valid, invalid, invalid; valid, valid, invalid ×4, invalid; 2 (coerced), invalid, invalid |
| ADM-CAR-002 | List and create | API | P1 | admin | `GET /api/carousels`; POST valid; POST `javascript:` link | sorted by sortOrder then createdAt; 201; 400 |
| ADM-CAR-003 | Update | API | P2 | slide | PUT a full valid body; PUT `{headline:"x"}` only; unknown id | 200; 400 (PUT needs the full schema because `carouselUpdateSchema` is unused, so confirm the UI always sends everything); 404 |
| ADM-CAR-004 | Toggle status | API | P2 | slide | PATCH `.../status {isActive:"yes"}`; unknown id | 400 "isActive must be a boolean"; ⚠️ 500 (intended 404) |
| ADM-CAR-005 | Delete | API | P2 | slide | DELETE | 200; gone from the public list |
| ADM-CAR-006 | Public carousel API | API | P1 | 2 active, 1 inactive | `GET /api/carousels/public` | active only, sorted; header `Cache-Control: public, s-maxage=60, stale-while-revalidate=120` |
| ADM-CAR-007 | Carousel UI to home | E2E | P1 | admin | create a slide with headline "Diwali Sale" and `sortOrder 1`; then toggle it off | home hero shows the slide first; after the toggle it is hidden |

### 4.24 Admin: consignment tracking, traffic and WhatsApp leads (ADM-TRK, ADM-TRF)

| ID | Case | Layer | Pri | Preconditions | Steps | Expected |
|---|---|---|---|---|---|---|
| ADM-TRK-001 | Track any AWB API | API | P1 | admin; MSW | `GET /api/admin/tracking?awb=123`; valid AWB; ST Courier down | 400 "must be exactly 11 digits"; 200 timeline; 502 |
| ADM-TRK-002 | Track any AWB page | E2E | P2 | admin | `/admin/tracking`, enter an AWB, submit; also open `?awb=bad` | timeline shown; a bad AWB shows the empty state |
| ADM-TRF-001 | Traffic page | E2E | P2 | visits, orders, leads | `/admin/traffic` | summary, sources, campaigns, recent visits and orders, WhatsApp leads and product stats render |
| ADM-TRF-002 | `getTrafficActivity` | API | P2 | 25 visits and orders; an order without attribution or name | call | at most 20 each, newest first; customer fallback label; attribution line "Direct" |
| ADM-TRF-003 | Lead status update | API | P1 | lead NEW | `PATCH /api/admin/whatsapp-clicks/[id] {status:"CONTACTED"}`; `{status:"WON"}`; unknown id | 200; 400; 404 "WhatsApp lead not found" |
| ADM-TRF-004 | Lead summary and product stats | API | P2 | leads in every status | `getWhatsAppLeadSummary()`, `getWhatsAppProductStats()`, `getRecentWhatsAppLeads()` | `open` = NEW + CONTACTED; `ordered` = ORDERED; per-product clicks, ordered and open; at most 80 recent, at most 24 products |
| ADM-TRF-005 | Lead status UI | E2E | P2 | admin | change a lead's status in the dropdown | toast "WhatsApp lead updated"; persists after reload |

### 4.25 Admin: exports (ADM-EXP)

| ID | Case | Layer | Pri | Preconditions | Steps | Expected |
|---|---|---|---|---|---|---|
| ADM-EXP-001 | Orders export | API | P1 | orders in every status | `POST /api/admin/orders/export {}`; then `{orderIds:[A,B]}` | xlsx (`Content-Type` spreadsheetml, `Content-Disposition` `Healargo_Orders_<date>.xlsx`); parsed with ExcelJS: sheet "Orders", header row present; first call PAID + REFUNDED only; second exactly A and B (any status) |
| ADM-EXP-002 | Users export | API | P1 | customerA: 1 PAID order of 630, 1 REFUNDED of 1000 | POST `{}` | xlsx; customerA order count and spend. ⚠️ Spend includes the REFUNDED 1000 today (shows 1630). Intended: 630 |
| ADM-EXP-003 | Products export | API | P2 | products with 2 or 3 variants | POST `{}` and `{productIds}` | one row per variant (or as designed); prices and stock match the DB |
| ADM-EXP-004 | Combos export | API | P2 | combos | POST | rows with status, discount %, item count, dates |
| ADM-EXP-005 | Missing logo | API | P2 | `public/healargo-logos/main-logo.png` absent (temporarily mock `fs.existsSync` to false) | each export | still 200 with a valid workbook |
| ADM-EXP-006 | Export buttons | E2E | P2 | admin | click Export on orders, users, products, combos | a download event with the `.xlsx` filename |

### 4.26 Cron tracking sync (CRN)

| ID | Case | Layer | Pri | Preconditions | Steps | Expected |
|---|---|---|---|---|---|---|
| CRN-001 | Cron auth | API | P0 | `CRON_SECRET` unset; then set | `GET /api/cron/tracking-sync` with no header, a wrong bearer, and the right bearer while the secret is unset | 401 in all three cases (an unset secret never allows access) |
| CRN-002 | Sync run | API | P1 | 3 SHIPPED orders with AWBs (MSW: delivered, in transit, down); 1 CONFIRMED with an AWB; fake timers to skip the 1.5 s waits | GET with the right bearer | `{checked:3, updated:2, delivered:1}`; the delivered one becomes DELIVERED; the CONFIRMED order is not touched |
| CRN-003 | Batch size and order | API | P2 | 55 SHIPPED orders, some with `trackingLastCheckedAt:null` | run | 50 processed. ⚠️ Postgres sorts NULL last on `ASC`, so never-checked orders go **last** (they may starve). Intended: nulls first |
| CRN-004 | One failure does not stop the batch | API | P1 | 2nd order's ST Courier call throws | run | the other orders are still processed; the failing one is `ok:false` |

### 4.27 SEO (SEO)

| ID | Case | Layer | Pri | Preconditions | Steps | Expected |
|---|---|---|---|---|---|---|
| SEO-001 | Sitemap | API | P1 | active and inactive products and categories | call `sitemap()` | 12 static routes, plus active categories (priority 0.8) and active products (0.9) with `lastModified = updatedAt`; no inactive ones; when the DB throws, static routes only |
| SEO-002 | Robots | Unit | P1 | `NEXT_PUBLIC_SITE_URL=https://healargo.test` | call `robots()` | disallows `/admin /admin/ /api/ /cart /checkout /orders /profile /login /register`; sitemap `https://healargo.test/sitemap.xml` |
| SEO-003 | Page metadata | Unit | P2 | none | `buildPageMetadata({title, path:"/shop"})` | canonical `${SITE}/shop`; OG and Twitter image default to the logo |
| SEO-004 | Combos and offers in the sitemap | Unit | P2 | live combo | `sitemap()` | ⚠️ `/combos`, `/combos/<slug>` and `/offers` are not in the sitemap today. Decide whether they should be indexed |

### 4.28 Security regression pack (cross-reference)

Tag these with `@security` so they can run on their own (`npx playwright test --grep @security`, `vitest -t security`):

| Threat | Cases |
|---|---|
| Unauthenticated access to admin APIs and pages | AUTH-033, AUTH-035, AUTH-036, CRN-001 |
| Non-admin (customer) on admin APIs and pages | AUTH-033, AUTH-036, AUTH-037 |
| IDOR on orders, payment, tracking, addresses | ORD-002, ORD-003, PAY-003, PAY-012, TRK-001, PRF-008, CHK-017 |
| Client price, status and role tampering | CHK-006, CPN-016, AUTH-004, PRF-002 |
| Coupon abuse (expired, used-up, inactive, restricted, race, >100 %) | CPN-005 to CPN-012, CPN-017, CPN-019, CPN-020, ADM-CPN-005 |
| Stock and quantity limits | CHK-010, CHK-015, CHK-016, CMB-011, PAY-026, CART-001, CART-003 |
| Webhook signature, duplicates, replay, ordering, amount | PAY-015 to PAY-024 |
| Account takeover and enumeration | AUTH-008, AUTH-020 to AUTH-027 |
| XSS and unsafe links | ADM-CAR-001, ORD-014 |
| Sensitive fields in responses | PRF-001, ADM-USR-001 |

---
## 5. Project setup

### 5.1 Proposed folder structure

> **As implemented:** `tests/{unit,api,e2e,fixtures,helpers,setup}` with flat files per area (see `tests/README.md`); no MSW, no `db-guard`/`db.ts` reset helpers (shared DB, 3.4), no CI workflow yet.

```
healargo/
├─ src/**/…                         # app code (unchanged, apart from the optional seams in Q1/Q2)
├─ src/lib/orders/pricing.test.ts   # existing, keep (or move to tests/unit/orders/)
├─ src/lib/utils/delivery.test.ts   # existing, keep
├─ tests/
│  ├─ unit/                         # Vitest, no DB
│  │  ├─ auth/        (schemas, authorized, callbacks, require-admin)
│  │  ├─ catalog/     (commerce, format, share-links, metadata)
│  │  ├─ cart/        (useCartStore.test.ts, @vitest-environment jsdom)
│  │  ├─ coupons/  orders/  payment/  shipping/  attribution/  analytics/  carousels/  seo/
│  ├─ api/                          # Vitest + test Postgres, route handlers called directly
│  │  ├─ auth/  catalog/  combos/  coupons/  orders/  payment/  tracking/  reviews/
│  │  ├─ user/  contact/  analytics/  cron/  seo/
│  │  └─ admin/   (products, categories, combos, coupons, orders, users, reviews, carousels, tracking, whatsapp, exports, access-sweep)
│  ├─ e2e/                          # Playwright
│  │  ├─ customer/  (auth.spec, browse.spec, pdp.spec, cart.spec, checkout.spec, payment.spec, orders.spec, profile.spec)
│  │  ├─ admin/     (access.spec, products.spec, orders.spec, coupons.spec, carousels.spec, users.spec, reviews.spec, exports.spec)
│  │  ├─ global-setup.ts           # reset + seed e2e DB, log in admin/customer, save storageState
│  │  └─ .auth/                    # gitignored storageState files
│  ├─ fixtures/
│  │  ├─ factories.ts              # makeUser, makeProduct, makeVariant, makeCombo, makeCoupon, makeOrder…
│  │  ├─ seed-test.ts              # the "std world" (section 3.3)
│  │  ├─ cashfree/*.json           # create-order, status PAID/ACTIVE/EXPIRED, webhook bodies
│  │  └─ st-courier/*.html         # recorded tracking pages
│  ├─ mocks/
│  │  ├─ msw-handlers.ts           # Cashfree, Brevo, ST Courier handlers (API tests)
│  │  ├─ cashfree-server.ts        # tiny HTTP mock used by E2E (needs Q1 seam)
│  │  └─ cashfree-sdk.js           # fake https://sdk.cashfree.com/js/v3/cashfree.js
│  └─ helpers/
│     ├─ db-guard.ts               # refuses non-test DATABASE_URL
│     ├─ db.ts                     # resetDb() (TRUNCATE … CASCADE), prisma test client
│     ├─ global-setup-db.ts        # prisma db push --force-reset
│     ├─ session.ts                # vi.mock auth: asAnon/asCustomer/asAdmin
│     ├─ request.ts                # jsonRequest(), params()
│     ├─ webhook.ts                # signWebhook(body, ts, secret)
│     └─ setup-api.ts              # MSW server start/stop, next/cache + email mocks, fake timers helpers
├─ vitest.config.ts                # two projects: unit, api
├─ playwright.config.ts
├─ .env.test.example               # committed (no secrets); .env.test is gitignored
└─ .github/workflows/tests.yml
```

### 5.2 New devDependencies

> **As implemented:** only `@playwright/test` was added; the fake server, env loading and Excel parsing use what the repo already had (`vitest`, `tsx`, `dotenv`, `exceljs`).

| Package | Why |
|---|---|
| `@playwright/test` | E2E runner (then `npx playwright install chromium`) |
| `msw` (v2) | Mock `fetch` to Cashfree, Brevo and ST Courier in API tests |
| `jsdom` | Vitest environment for the Zustand store, `localStorage` and `sessionStorage` helpers, PostHog wrappers |
| `@testing-library/react` | `renderHook` for `useAdminList` (optional, P2 only) |
| `@vitest/coverage-v8` | coverage report (`--coverage`) |
| `dotenv-cli` | load `.env.test` on Windows and Linux the same way (`dotenv -e .env.test -- …`) |

(`vitest`, `tsx`, `prisma`, `dotenv` already exist.)

### 5.3 npm scripts

> **As implemented:** `test` / `test:unit` = `vitest run --project unit`, `test:api` = `vitest run --project api`, `test:e2e` = `playwright test`, `test:all` runs the three in a row. Env loading is done in code (`tests/helpers/env.ts`), so no `dotenv-cli`.

```jsonc
"test":         "vitest run --project unit",                       // fast, no DB (keeps today's meaning)
"test:unit":    "vitest run --project unit",
"test:api":     "dotenv -e .env.test -- vitest run --project api",
"test:e2e":     "dotenv -e .env.test -- playwright test",
"test:e2e:ui":  "dotenv -e .env.test -- playwright test --ui",
"test:all":     "npm run test:unit && npm run test:api && npm run test:e2e",
"test:db:reset":"dotenv -e .env.test -- prisma db push --force-reset --skip-generate",
"test:watch":   "vitest --project unit",
"test:coverage":"dotenv -e .env.test -- vitest run --coverage"
```

`vitest.config.ts` (sketch): `test.projects = [{ name:"unit", include:["src/**/*.test.ts","tests/unit/**/*.test.ts"], environment:"node" }, { name:"api", include:["tests/api/**/*.test.ts"], setupFiles:["tests/helpers/setup-api.ts"], globalSetup:["tests/helpers/global-setup-db.ts"], fileParallelism:false, testTimeout:20000 }]`, keeping the `@` alias.

`playwright.config.ts` (sketch): `webServer: { command: "npm run build && npm run start -- -p 3100", url: "http://localhost:3100", reuseExistingServer: !process.env.CI, timeout: 180000 }`, projects `chromium` and `mobile-chrome` (checkout specs only), `use.baseURL = http://localhost:3100`, `retries: CI ? 2 : 0`, `trace: "on-first-retry"`, HTML report. Locally you can swap the command for `next dev -p 3100` for speed.

### 5.4 Environment variables (`.env.test`; all dummy values, no real secrets)

> **As implemented:** you only create `.env.test.local` with `DATABASE_URL`, `DIRECT_URL` (or let them fall back to `.env.local`) and `TESTS_MAY_WRITE_TO_DATABASE=yes`; every other value is forced by `tests/helpers/env.ts`. Optional: `FAKE_SERVICES_PORT` (4599), `E2E_PORT` (3100), `TEST_RUN_ID`, `PW_CHANNEL`. The Cashfree override is named `CASHFREE_BASE_URL`. Full list in `tests/README.md`.

| Variable | Test value | Used by |
|---|---|---|
| `DATABASE_URL` | `postgresql://postgres:postgres@localhost:5433/healargo_test` (API) / `…/healargo_e2e` (E2E) | Prisma |
| `DIRECT_URL` | same as `DATABASE_URL` (required by `schema.prisma` `directUrl`) | Prisma CLI |
| `AUTH_SECRET` | any 32+ character random string | NextAuth JWT |
| `AUTH_URL` / `NEXT_PUBLIC_SITE_URL` | `http://localhost:3100` | NextAuth, reset links, Cashfree return URL, sitemap |
| `AUTH_TRUST_HOST` | `true` | NextAuth behind localhost |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | empty (one AUTH-018 run sets dummy values) | Google button |
| `CASHFREE_ENV` | `SANDBOX` | host and mode |
| `CASHFREE_APP_ID` / `CASHFREE_SECRET_KEY` | `test_app_id` / `test_secret` (the secret is also the webhook HMAC key in tests) | payment |
| `CASHFREE_API_BASE_URL` | `http://localhost:4010` (E2E only, **needs the Q1 seam**) | mock Cashfree |
| `BREVO_API_KEY` / `EMAIL_FROM` | empty (console mode); API tests set them per test when asserting Brevo payloads | email |
| `ADMIN_NOTIFY_EMAIL` | `admin-notify@test.local` | admin emails |
| `CRON_SECRET` | `test-cron-secret` | cron |
| `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN`, `NEXT_PUBLIC_GA_ID` | empty | analytics off |
| `TEST_ADMIN_PASSWORD`, `TEST_CUSTOMER_PASSWORD` | e.g. `Test@12345` | fixtures |
| `TEST_DB_ALLOWED_HOSTS` | `localhost,127.0.0.1` | db-guard |

### 5.5 Running locally on Windows (PowerShell)

> **As implemented** (no Docker, shared DB): `npm ci`, `npm run db:push`, `npx playwright install chromium`, `Copy-Item .env.test.example .env.test.local` and fill it in, then `npm test`, `npm run test:api`, `npm run test:e2e` (starts the fake server and `next dev -p 3100` itself). The original sketch follows.

```powershell
# 1) One-time: a throwaway Postgres (Docker Desktop). Alternative: local PostgreSQL install + createdb healargo_test
docker run -d --name healargo-test-db -e POSTGRES_PASSWORD=postgres -p 5433:5432 postgres:16
docker exec healargo-test-db psql -U postgres -c "CREATE DATABASE healargo_test;" -c "CREATE DATABASE healargo_e2e;"

# 2) One-time: deps + browsers
npm install
npx playwright install chromium
Copy-Item .env.test.example .env.test     # then edit values if needed

# 3) Run
npm test                 # unit only (seconds)
npm run test:api         # resets + seeds healargo_test automatically
npm run test:e2e         # builds the app, starts it on :3100, runs Playwright
npm run test:all         # everything, before every deploy
npx playwright show-report
```

Notes (original design; superseded by Q6, the tests now use the shared DB with marker cleanup). The real `npm run seed` wipes the DB and must never be used for tests. Keep Docker running while testing.

### 5.6 CI: GitHub Actions (`.github/workflows/tests.yml`)

> **Not created yet** (Q9 open). If added, CI can use a throwaway Postgres service as below (run `prisma db push` on it first); the suites work on any DB.

```yaml
name: tests
on: { pull_request: {}, push: { branches: [main] }, schedule: [{ cron: "30 20 * * *" }] }  # nightly 02:00 IST
jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env: { POSTGRES_PASSWORD: postgres }
        ports: ["5433:5432"]
        options: >-
          --health-cmd "pg_isready -U postgres" --health-interval 5s --health-retries 10
    env: # same keys as .env.test, dummy values; nothing from repository secrets is needed
      AUTH_SECRET: ci-only-secret-0123456789abcdef0123
      CASHFREE_APP_ID: test_app_id
      CASHFREE_SECRET_KEY: test_secret
      CRON_SECRET: test-cron-secret
      NEXT_PUBLIC_SITE_URL: http://localhost:3100
      AUTH_URL: http://localhost:3100
      AUTH_TRUST_HOST: "true"
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci
      - run: psql postgresql://postgres:postgres@localhost:5433/postgres -c "CREATE DATABASE healargo_test" -c "CREATE DATABASE healargo_e2e"
      - run: npm run lint
      - run: npm run test:unit
      - run: npm run test:api          # DATABASE_URL/DIRECT_URL → healargo_test
      - run: npx playwright install --with-deps chromium
      - run: npm run test:e2e          # DATABASE_URL/DIRECT_URL → healargo_e2e; PRs: --grep @p0, nightly: all
      - uses: actions/upload-artifact@v4
        if: failure()
        with: { name: playwright-report, path: playwright-report }
```

Make "tests" a **required status check** on `main` so a red build blocks merging.

### 5.7 Working rules for future features

1. A new route or page means new rows in the matching table in section 4 (the next free ID, never reusing old IDs), plus at least one API case for auth and validation, and, if it is admin-only, adding it to the AUTH-036 sweep list.
2. A bug fix comes with a test that fails before the fix.
3. Not-yet-automated cases live as `test.todo("<ID> …")` in `tests/unit/plan-todo.test.ts`; when you automate one, delete its todo line.
4. Create test data only through `tests/fixtures/factory.ts` (or include the run marker) so cleanup removes it from the shared DB.

---

## 6. Implementation order and effort

| Phase | Scope | Cases | Effort (1 developer) |
|---|---|---|---|
| **0. Foundation** | devDependencies, `vitest` projects, db-guard, test DB reset and seed, factories, session, request and webhook helpers, MSW handlers, Playwright config, `.env.test.example`, CI workflow skeleton | none | 1.5 to 2 days |
| **1. Unit P0/P1** | commerce, pricing, coupon math, schemas, `authorized()`/callbacks/`requireAdmin`, webhook signature, site-url, cashfree-auth, ST Courier parser and consignment, attribution parse, cart store, carousel schema, robots | about 45 | 1.5 days |
| **2. API P0: money and security** | AUTH-036 sweep, register/reset, orders (CHK-004 to CHK-017), coupons, payment create/status/webhook/idempotency/concurrency, mark-paid, refund, tracking PUT, IDOR set, profile and addresses | about 75 | 3 to 4 days |
| **3. E2E P0 journeys** | login/logout, route protection, PDP, cart, checkout happy path with fake Cashfree, payment failure, IDOR pages, admin product create, admin order status/tracking/refund | about 20 | 2.5 to 3 days (includes the Q1 seam and the fake SDK) |
| **4. API P1/P2 + admin modules** | catalog, combos, reviews, contact, analytics, users, carousels, coupons admin, exports (ExcelJS parse), cron, sitemap | about 130 | 3 to 4 days |
| **5. E2E P1/P2 + polish** | remaining E2E (profile, reviews lifecycle, carousels, coupons UI, exports, traffic), mobile project, `@security` and `@p0` tags, flake hardening, README "How to test" | about 65 | 2 to 3 days |
| **Total** | | **335** | **about 14 to 17 working days**. Phases 0 to 3 (about 9 days) already give release-blocking coverage of every P0 |

Suggested milestone for approval: deliver **phases 0 to 2** first as one PR (unit and API, about 120 cases, CI green apart from the ⚠️ `it.fails`), then E2E.

---

## 7. Open questions, risks and findings

### 7.1 Questions for the owner (please answer before implementation)

> **Owner decisions:** Q1 yes (test-only overrides; Brevo too). Q3 fix the bugs and test the intended behaviour. Q4 remove `PURE10` and all hard-coded coupons (usage is now counted on payment, atomically). Q5 refunds stay **manual** (no Cashfree call) and unpaid orders cannot be refunded. Q6 tests use the **same database** for now (a separate Supabase project later for production). Q8 implemented as: login honours a safe same-site `callbackUrl`; without one everyone lands on `/` (a signed-in user opening `/login` is sent home). Q10 emails fall back to the account email. Q11 admin list shows every payment status. Q12 cancelling or refunding restores stock once. Q2, Q7, Q9: see section 8.

| # | Question | Why it matters |
|---|---|---|
| **Q1** | May I add **tiny, test-only seams** to app code? (a) `CASHFREE_API_BASE_URL` env override in `getCashfreeHost()`; (b) `ST_COURIER_BASE_URL` override; both default to today's URLs. | Without them, browser E2E can't mock the server-side calls to Cashfree and ST Courier. The alternative is the real Cashfree **sandbox** in E2E, which needs sandbox keys in CI and is slower and flakier. API tests don't need this (MSW). |
| **Q2** | OK to move the credentials `authorize()` function into its own file (`lib/auth/authorize-credentials.ts`) with no behaviour change? | Lets us unit-test login (bcrypt, lower-casing, Google-only users) without a browser. |
| **Q3** | For the 50 cases marked ⚠️ (likely bugs), should tests assert the **intended** behaviour (marked `it.fails` until fixed) or lock in **current** behaviour? | Recommended: intended behaviour plus `it.fails`, so fixing the bug turns them green. |
| **Q4** | Coupons: (a) count usage on **payment** instead of order creation? (b) a per-customer limit? (c) a **minimum order amount**? (not in the model today) (d) should the hard-coded `PURE10` (10 %, no expiry, no limit, anyone can use it) still exist? | Affects CPN-018/020, adds cases for a minimum amount, and is a revenue leak today. |
| **Q5** | Refunds: is "Refund" meant to be **manual** (money returned outside the app)? Should it call Cashfree's refund API? Should refunding an **unpaid** order be blocked? | ADM-ORD-012 to 014. |
| **Q6** | Test database: Docker Desktop on your Windows PC, or a separate free Supabase project just for tests? There's no `prisma/migrations` folder (you use `db push`). Is that intentional for production too? | Setup steps; migrations make prod schema changes safer. |
| **Q7** | Reviews: allow anonymous reviews? One review per user per product? Only for verified buyers? | REV-005 to 007. |
| **Q8** | After login, should users return to where they were (`callbackUrl`, e.g. back to `/checkout`), and should admins land on `/admin`? | AUTH-038. Today everyone goes to `/`. |
| **Q9** | Is GitHub Actions enabled on `Umarfarook1912/healargo`, and should tests be a required check before merge or deploy (Vercel)? | CI plan. |
| **Q10** | Order emails go only to the **email typed in the shipping address**, which is optional. Should they fall back to the account email? | ORD-013. Customers who leave it blank get no confirmation. |
| **Q11** | Admin orders list shows **only PAID and REFUNDED**. Should PENDING and FAILED (including admin-created) orders be visible, at least under a filter? | ADM-ORD-001/002. |
| **Q12** | Admin "Cancel" (status CANCELLED) and PATCH `paymentStatus: REFUNDED` don't restore stock. Is the refund button the only intended path? | ADM-ORD-008/009. |

### 7.2 Notable bugs and suspicious behaviour found while reading the code

Ordered by business impact. File references are to `src/`.

> **Status (Nov 2026):** every item below was **fixed** (minimal changes in the existing style) unless its "Status" note says otherwise. Each fix has tests named after the case IDs in brackets.

**Payments and stock (highest risk)**
1. **A late "failed" webhook downgrades a PAID order to FAILED.** `api/payment/cashfree/webhook/route.ts` sets `paymentStatus: FAILED` on any FAILED or USER_DROPPED event with no check that the order is already PAID. Cashfree sends one webhook per payment attempt, so "attempt 1 failed, attempt 2 succeeded" can arrive out of order. (PAY-020) — **Fixed:** a failed event never downgrades PAID, and only the order's current session can mark it FAILED.
2. **Retrying payment orphans the earlier payment.** Every `POST /api/payment/cashfree` overwrites `cashfreeOrderId`. If the customer pays on an earlier Cashfree session (second tab, back button), its webhook returns **404** and the order stays PENDING although the money was captured. The route also lets an **already PAID, REFUNDED or CANCELLED** order be paid again. (PAY-006/007) — **Fixed:** the previous Cashfree session is recorded and resumed; the webhook also finds older sessions; PAID, REFUNDED and CANCELLED orders cannot be paid again.
3. **Stock is checked at order time but reserved only at payment time.** If stock runs out in between, `markOrderPaid` throws, so the webhook returns 500 (Cashfree keeps retrying) and a **paid order stays PENDING**. Combos are never stock-checked before payment, and the same variant on two cart lines bypasses the per-line check. (PAY-026, CMB-011, CHK-015) — **Fixed:** combos are expanded and duplicate variants merged in the stock check (order and payment); if stock ran out the paid order stays PAID (webhook 200) with an admin note instead of a 500.
4. **`markOrderPaid` is not atomic.** On return from Cashfree, three things call it at the same moment: the confirmation page (server), `CashfreeStatusSync` (client polling `/status`) and the webhook. Each reads `paymentStatus`/`stockDecremented` and then updates, so a **double stock decrement and duplicate emails** are possible. A conditional update (`updateMany where paymentStatus != PAID`) or a row lock fixes it. (PAY-024) — **Fixed:** `markOrderPaid` claims the order with a conditional update, so stock, coupon usage and emails happen exactly once.
5. **Refunds don't restore combo stock.** `restoreStockForItems` looks the line up as a product only, so combo lines are skipped. Cancelling via PATCH, PATCH-to-REFUNDED and deleting an order never restore stock. Refund also marks never-paid orders as REFUNDED and doesn't call Cashfree. (CMB-012, ADM-ORD-008/009/014/016) — **Fixed:** stock (combos included) is restored exactly once on refund, cancel, PATCH-to-REFUNDED and delete; refunds stay manual (Q5) and unpaid orders get 400.
6. **The webhook doesn't verify the amount or the timestamp age.** A captured, validly signed webhook can be replayed indefinitely. It's harmless only while the handler is idempotent. (PAY-022/023) — **Partly fixed:** a paid amount that differs from the order total is flagged in the order notes (not rejected: money is captured). Timestamp age is still not enforced; replays are harmless because the handler is idempotent.
7. **The cart is cleared before the Cashfree redirect**, and there is no "retry payment" for an existing order, so a failed or cancelled payment leaves the customer with an empty cart although the message says "retry from checkout". (PAY-029) — **Fixed:** the cart is cleared only after the payment is PAID; the confirmation page shows "Payment failed. You can retry from checkout." with the cart kept.

**Auth and access**

8. **Role changes don't take effect until re-login.** `requireAdmin()` trusts the role stored in the JWT, and the `jwt` callback only reloads the user at sign-in. A demoted (or deleted) admin keeps admin API access until their session expires (NextAuth default: 30 days). The "last admin" guards are therefore only reachable through a stale token. (AUTH-037) — **Fixed:** admin APIs, pages and the admin layout re-read the role from the DB, so demotion or deletion takes effect immediately.
9. **Login ignores `callbackUrl`.** Users bounced from `/checkout` (or `/orders/<id>/confirmation`, for example after returning from Cashfree with a lost session) land on `/` after signing in; admins also land on `/` instead of `/admin`. (AUTH-038) — **Fixed:** login honours a safe same-site `callbackUrl` (open-redirects rejected). Without one everyone lands on `/` (admins included) to avoid a redirect loop.
10. `scripts/seed.ts` **wipes every table** (users and orders included) and creates an admin with a **hard-coded default password**. Make sure production's admin password was changed, and never run `npm run seed` with production env values. — **Fixed:** seed refuses production, needs `--confirm-wipe` (or `SEED_CONFIRM=wipe`) and `SEED_ADMIN_PASSWORD` (10+ chars); no default password.

**Coupons**

11. `timesUsed` is incremented when an order is **created** (even if never paid), so abandoned checkouts burn limited coupons. The limit check and the increment aren't atomic (race), and there's no per-user limit. The static fallback **`PURE10` gives 10 % off forever to anyone** unless a DB coupon with that code overrides it. (CPN-013/018/020) — **Fixed:** usage is counted on payment success with an atomic limit check; `PURE10` and every hard-coded coupon removed (Q4). No per-user limit (not requested).
12. The admin coupon API accepts **percentage > 100**, `validTo` before `validFrom`, and invalid date strings (500). (ADM-CPN-005) — **Fixed:** percentage capped at 100, `validTo` must follow `validFrom`, bad dates give 400.

**Data integrity and validation**

13. `PUT /api/products/[id]`, `PUT /api/categories/[id]` and `PUT /api/combos/[id]` pass the **raw request body to Prisma** (no zod): unknown fields give a 500, and fields like `averageRating`/`reviewCount` or a negative price can be written. Product create also allows negative price and stock. (ADM-PRD-004/006, ADM-CMB-004) — **Fixed:** zod validation on product, category and combo create/update (unknown keys stripped, no negative prices or stock, rating fields not writable).
14. Deleting a product that has ever been ordered, or a category that has products, fails with a raw **500 foreign-key error**. A duplicate product or combo name gives a 500 (unique slug). (ADM-PRD-003/009, ADM-CAT-003) — **Fixed:** ordered products are archived (deactivated) instead of a 500; a category with products gives 409; duplicate names get a unique slug. Schema: `OrderItem.productId` is no longer a foreign key (so combo lines and history survive).
15. Reviews: a **fractional rating (4.5) gives a 500**, an unknown productId gives a 500, and anonymous, unlimited reviews are allowed. (REV-005 to 007) — **Fixed:** integer ratings only, unknown product 404, one review per signed-in customer per product (guests may still post moderated reviews).
16. Renaming a product silently **changes its slug** (breaking shared links and SEO), and the fuzzy slug fallback serves *some* product for any URL that contains a matching word. (ADM-PRD-005, PDP-003) — **Fixed:** renaming keeps the slug; the legacy fallback only accepts an exact slug match.
17. Phone and PIN code are validated by **length only** (`"abcdefghij"` is a valid phone, `"ABCDEF"` a valid PIN). — **Fixed:** phone must be a 10-digit Indian mobile number and PIN a 6-digit code.

**Admin reporting**

18. Admin orders list hides **PENDING and FAILED** orders, including orders the admin just created (default PENDING). Admin-created PAID orders **don't decrement stock**. (ADM-ORD-002/004) — **Fixed:** the admin list shows every payment status (with a filter); admin-created PAID orders go through `markOrderPaid`, so stock is decremented.
19. Dashboard "out of stock" only inspects the **12 newest** products. (ADM-DSH-003) — **Fixed:** the out-of-stock card checks every product.
20. Users export counts **REFUNDED** orders in "total spend". (ADM-EXP-002) — **Fixed:** REFUNDED orders are excluded from total spend.
21. Cron tracking sync orders by `trackingLastCheckedAt ASC`. In Postgres NULLs sort **last**, so shipments that were never checked are processed last and can starve once there are more than 50 shipped orders. (CRN-003) — **Fixed:** never-checked shipments are synced first.

**Minor and observations**

22. Public endpoints expose inactive data: `GET /api/products?active=false`, `GET /api/products/[id]` (inactive), `GET /api/combos` (all), `GET /api/categories` (all). (CAT-003/004/005, CMB-001) — **Fixed:** public product, combo and category APIs return active items only (admins still see all).
23. `resolveSiteUrl` builds Cashfree return and notify URLs from the request's `Host`/`X-Forwarded-Host` headers, so a client can make its own order's `notify_url` point elsewhere. Prefer `NEXT_PUBLIC_SITE_URL` in production. — **Fixed:** in production the site URL comes from `NEXT_PUBLIC_SITE_URL`; request host headers are only used in development.
24. `comboIsLive` ignores a combo that has only a start or only an end date (treated as always live). (CMB-002) — **Fixed:** a combo with only a start or only an end date honours it.
25. Order emails depend on the optional shipping email (Q10). Dead constant `API_ENDPOINTS.ADMIN_STATS` has no route. The checkout summary shows the price stored in the cart, which can differ from what the server charges after an admin price change (the server is correct). (CART-010) — **Fixed:** emails fall back to the account email; dead `ADMIN_STATS` constant removed. **Not changed:** the checkout summary still shows the cart's stored price (the server charges the correct one; CART-010 stays a todo).

### 7.3 Risks to the test effort

* **ST Courier is HTML scraping.** Fixtures will go stale when their page changes. Keep one manual or nightly "live smoke" (P2, not blocking) to detect parser breakage.
* **Google OAuth** can't be automated reliably. A manual checklist item stays before each release.
* **Next.js 15 route handlers** imported in Vitest need `next/cache` mocked and `params` passed as a Promise. Some handlers import heavy modules (ExcelJS, `fs`), so export tests may be slower.
* **Shared DB means serial API tests.** If the suite grows past about 5 minutes, move to per-worker schemas.
* **Fixing ⚠️ items changes expected results.** Each fix PR should flip its `it.fails` cases.

---

## 8. Implementation status (Nov 2026)

**Where:** `tests/` in the repo (layout and how-to in `tests/README.md`), `vitest.config.ts` (projects `unit` and `api`), `playwright.config.ts`. Every test name starts with its case ID.

**Counts.** 256 of the 335 plan cases are automated, including **all 114 P0** cases (P1 101/143, P2 41/78). The other 79 cases, plus ADM-USR-003(c), are `test.todo` entries in `tests/unit/plan-todo.test.ts`. In runner terms:

| Suite | Command | Tests | Todo |
|---|---|---|---|
| Unit | `npm test` | 94 | 80 (the plan todos) |
| API | `npm run test:api` | 241 | 1 (PAY-028 API variant; covered in E2E) |
| E2E | `npm run test:e2e` | 23 | 0 |

**Coverage by module (plan cases automated / todo / P0 automated):**

| Module | Cases | Automated | Todo | P0 |
|---|---|---|---|---|
| AUTH | 38 | 30 | 8 | 17/17 |
| CAT | 21 | 15 | 6 | 5/5 |
| PDP | 14 | 7 | 7 | 4/4 |
| CMB | 12 | 8 | 4 | 6/6 |
| CART | 13 | 9 | 4 | 4/4 |
| CPN | 22 | 21 | 1 | 13/13 |
| CHK | 20 | 16 | 4 | 10/10 |
| PAY | 30 | 29 | 1 | 16/16 |
| ORD | 15 | 9 | 6 | 5/5 |
| TRK | 10 | 8 | 2 | 5/5 |
| REV | 10 | 8 | 2 | 1/1 |
| PRF | 11 | 8 | 3 | 5/5 |
| CON | 8 | 7 | 1 | 1/1 |
| ANL | 13 | 10 | 3 | 3/3 |
| ADM-DSH | 4 | 1 | 3 | 0/0 |
| ADM-PRD | 15 | 11 | 4 | 4/4 |
| ADM-CAT | 5 | 3 | 2 | 0/0 |
| ADM-CMB | 6 | 4 | 2 | 1/1 |
| ADM-CPN | 8 | 7 | 1 | 2/2 |
| ADM-ORD | 23 | 19 | 4 | 7/7 |
| ADM-USR | 6 | 5 | 1 (+ USR-003(c)) | 2/2 |
| ADM-REV | 3 | 2 | 1 | 1/1 |
| ADM-CAR | 7 | 6 | 1 | 1/1 |
| ADM-TRK | 2 | 1 | 1 | 0/0 |
| ADM-TRF | 5 | 1 | 4 | 0/0 |
| ADM-EXP | 6 | 4 | 2 | 0/0 |
| CRN | 4 | 4 | 0 | 1/1 |
| SEO | 4 | 3 | 1 | 0/0 |
| **Total** | **335** | **256** | **79** | **114/114** |

**Shared DB.** API and E2E write marked rows to the database in `DATABASE_URL` and delete only those (3.4). They need `TESTS_MAY_WRITE_TO_DATABASE=yes`.

**Not automated by design:** the Google OAuth round trip (manual check before releases), live ST Courier HTML (the parser is tested against fixtures), and ADM-USR-003(c) (it needs a database where demoting every admin is safe).

**Open:** Q2 (`authorize()` was not moved; login is covered by E2E), Q7 (guests may still post moderated reviews; no verified-buyer rule), Q9 (no CI workflow yet; 5.6 is ready to use with a throwaway Postgres service).
