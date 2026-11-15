# Healargo tests

Three suites, all driven from `package.json`:

| Command | Suite | Needs a DB? | Time |
|---|---|---|---|
| `npm test` / `npm run test:unit` | Vitest unit tests (`tests/unit`, `src/**/*.test.ts`) | no | seconds |
| `npm run test:api` | Vitest API tests (`tests/api`): route handlers called in-process | **yes, writes to it** | ~10 s |
| `npm run test:e2e` | Playwright (`tests/e2e`): `next dev` on port 3100 + a real browser | **yes, writes to it** | 1-3 min |
| `npm run test:all` | all three in a row | yes | |

Cases come from `TEST_PLAN.md`; every test name starts with its case ID (for example
`CHK-011`). Cases that are not automated yet are listed as `test.todo` in
`tests/unit/plan-todo.test.ts` (Vitest prints them as "todo"). When you automate one,
delete its todo line and put the ID in the new test's name.

## ⚠️ The API and E2E suites write to the database in `DATABASE_URL`

By decision, the tests use **the same Supabase database as the app** (a separate
project can come later). So the suites were written to be safe on a live database:

* They **never** truncate, reset or `db push --force-reset`, and never run `scripts/seed.ts`.
* Every row they create carries a run marker: emails `test+hgtest…@healargo.test`,
  slugs/names containing `hgtest…`, coupon codes `HGTEST…`, order shipping names
  containing `hgtest…`.
* After each API file and after the E2E run, `tests/fixtures/cleanup.ts` deletes
  **only** rows carrying the marker, in foreign-key order (order items/orders, reviews,
  clicks/visits, coupons, carousels, combos, products, categories, users). A run that
  crashed is swept by the next run. Never create real data containing `hgtest`.
* Tests that read global numbers (dashboard, exports, coupon lists) assert only on
  their own rows. The admin access sweep (AUTH-036) snapshots real rows and checks
  that nothing changed. The cron tracking sync is tested with a mocked Prisma client,
  so it never touches real shipped orders.
* While the tests run, the admin panel briefly shows the test orders, products and
  users (all marked `hgtest`). The storefront may briefly list a test product.
* One plan case cannot run on a shared DB and stays a todo:
  ADM-USR-003(c) "cannot demote the last admin" (it would need every real admin demoted).

The suites refuse to start unless you confirm with `TESTS_MAY_WRITE_TO_DATABASE=yes`.

## External services are faked

No real Cashfree, ST Courier, Brevo or PostHog call is ever made. The test env
(`tests/helpers/env.ts`) **forces** dummy secrets and points the app at a local fake
server (`tests/helpers/fake-services.ts`, port 4599) through three test-only
overrides. When these variables are unset (production) the app behaves exactly as before:

| Variable | Production (unset) | Tests |
|---|---|---|
| `CASHFREE_BASE_URL` | Cashfree sandbox/production host from `CASHFREE_ENV` (the override is **ignored** when `CASHFREE_ENV=PRODUCTION`) | `http://127.0.0.1:4599` |
| `ST_COURIER_BASE_URL` | `https://stcourier.com` | `http://127.0.0.1:4599` |
| `BREVO_API_URL` | `https://api.brevo.com/v3/smtp/email` | `http://127.0.0.1:4599/v3/smtp/email` |

PostHog and GA keys are forced empty (analytics off). In the browser, Playwright
serves a fake Cashfree JS SDK (`page.route`) whose `checkout()` goes to the app's
`return_url`, and the fake server decides the outcome (PAID, EXPIRED, …).

## One-time setup (Windows PowerShell)

```powershell
cd D:\healargo
npm ci                          # also runs prisma generate
npm run db:push                 # applies the one schema change (see below), uses .env.local
npx playwright install chromium

# Create .env.test.local (gitignored; never commit it). Copy the example first:
Copy-Item .env.test.example .env.test.local
notepad .env.test.local         # set DATABASE_URL / DIRECT_URL and TESTS_MAY_WRITE_TO_DATABASE=yes
```

If `.env.test.local` has no `DATABASE_URL`, the suites fall back to `DATABASE_URL` /
`DIRECT_URL` from `.env.local` or `.env` (only those two keys are read from the app's
env files; every other value comes from the forced test env).

Make sure `.gitignore` covers `.env.test.local`, `tests/e2e/.auth/`, `test-results/`
and `playwright-report/`.

## Running

```powershell
npm test               # unit, no DB
npm run test:api       # writes hgtest rows to DATABASE_URL, deletes them afterwards
npm run test:e2e       # starts the fake server + next dev on :3100 automatically
npm run test:all
npx playwright show-report
npx playwright test tests/e2e/checkout.spec.ts --headed   # one file, visible browser
npx vitest run --project api tests/api/payment.test.ts    # one API file
```

If you already have `npm run dev` open on port 3000 that is fine; E2E uses 3100
(`E2E_PORT`). If something is already listening on 3100 or 4599 locally, Playwright
reuses it, so stop stray servers first.

## Environment variables used by the tests

| Variable | Where | Meaning |
|---|---|---|
| `DATABASE_URL`, `DIRECT_URL` | `.env.test.local` (or `.env.local`) | DB the API/E2E suites write to |
| `TESTS_MAY_WRITE_TO_DATABASE` | `.env.test.local` | must be `yes`, otherwise API/E2E refuse to run |
| `FAKE_SERVICES_PORT` | optional | fake Cashfree/ST Courier/Brevo port (default 4599) |
| `E2E_PORT` | optional | port for `next dev` in E2E (default 3100) |
| `TEST_RUN_ID` | optional | fixed run marker (must start with `hgtest`); default is random per run |
| `PW_CHANNEL` | optional | e.g. `chrome` or `msedge` to use an installed browser instead of Playwright's Chromium |
| `CASHFREE_BASE_URL`, `ST_COURIER_BASE_URL`, `BREVO_API_URL` | forced by the tests | see above; leave unset in production |

Seeding (not used by tests): `npm run seed` now refuses to run in production, needs
`npm run seed -- --confirm-wipe` (or `SEED_CONFIRM=wipe`) because it **deletes all
users, orders and products**, and needs `SEED_ADMIN_PASSWORD` (10+ characters;
`SEED_ADMIN_EMAIL` optional). Never run it against the shared database.

## Layout

```
tests/
  unit/       pure logic, mocked Prisma where needed; plan-todo.test.ts = not-yet-automated cases
  api/        route handlers called directly (auth and next/cache mocked, fake server per file)
  e2e/        Playwright specs, fake-server.ts, global-setup.ts (creates the hgtest world),
              global-teardown.ts (cleanup), support.ts (login, fake SDK, helpers)
  fixtures/   factory.ts (marked rows), cleanup.ts (marker-only delete), run.ts (run id)
  helpers/    env.ts (test env + DB write guard), fake-services.ts, http.ts (call a handler,
              sign a webhook), session.ts (mock auth())
  setup/      Vitest setup files
```

## Writing new tests

1. Add the case to `TEST_PLAN.md` (next free ID), then name the test `"<ID> …"`.
2. Create data only with `tests/fixtures/factory.ts` (or include `RUN_ID` / `uid()` in
   every email, slug, name and code) so cleanup can find it.
3. Never assert on global totals; assert on your own rows.
4. A bug fix comes with a test that fails before the fix.
