# Healargo tests

Three suites, all driven from `package.json`:

| Command | Suite | Needs a DB? | Time |
|---|---|---|---|
| `npm test` / `npm run test:unit` | Vitest unit tests (`tests/unit`, `src/**/*.test.ts`) | no | seconds |
| `npm run test:api` | Vitest API tests (`tests/api`): route handlers called in-process | **yes, writes to it** | ~10 s local, ~10-25 min on remote Supabase |
| `npm run test:e2e` | Playwright (`tests/e2e`): `next dev` on port 3100 + a real browser | **yes, writes to it** | 1-3 min local, longer on remote Supabase |
| `npm run test:all` | runs unit, api and e2e **even if one fails**, then prints a PASS/FAIL summary (exit 1 if any failed) | yes | |
| `npm run test:cleanup` | deletes leftover `hgtest` rows (after an interrupted run) and prints the counts; `-- --dry-run` only counts | yes | seconds |

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

After an interrupted run (Ctrl+C, laptop asleep) check for leftovers:

```powershell
npm run test:cleanup -- --dry-run   # count only
npm run test:cleanup                # delete them (only hgtest-marked rows)
```

## Running against the remote Supabase database

Every query is a network round trip (about 0.2-0.5 s from India to Supabase), so the
suites are tuned for that:

* **Timeouts:** 120 s per API test and 300 s per hook (`TEST_TIMEOUT_MS`,
  `TEST_HOOK_TIMEOUT_MS`); E2E 240 s per test, 45 s per assertion, 120 s per
  navigation (`E2E_TEST_TIMEOUT_MS`, `E2E_EXPECT_TIMEOUT_MS`, `E2E_NAVIGATION_TIMEOUT_MS`,
  `E2E_ACTION_TIMEOUT_MS`, `E2E_SERVER_TIMEOUT_MS`). Set any of them in `.env.test.local`.
* **Small connection pool:** the tests add `connection_limit=3`, `pool_timeout=120` and
  `connect_timeout=60` to `DATABASE_URL` (only if your URL doesn't set them;
  `TEST_DB_CONNECTION_LIMIT`, `TEST_DB_POOL_TIMEOUT_S`, `TEST_DB_CONNECT_TIMEOUT_S`).
  The app itself is not affected.
* **Retry with backoff:** before a suite starts it waits for the database, and any query
  that fails with "Can't reach database server" (or a pool timeout) is retried up to
  5 times (1, 2, 4, 8, 16 s; `TEST_DB_RETRIES`). You'll see `[tests] … retry n/5` lines.
* API files run one at a time; fixtures are created one by one, not in parallel.
* If "Can't reach database server" keeps happening on the direct host
  (`db.<project>.supabase.co:5432`), try Supabase's **session pooler** connection string
  (Project Settings → Database → Connection string → Session pooler) as `DATABASE_URL`
  in `.env.test.local`.

Some `prisma:error` lines in the API output are expected: they come from tests that
check an error path on purpose, for example "No record was found for an update"
(ADM-ORD-019, deleting tracking for an unknown order returns 404).

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
npm run test:all       # every suite, then a summary; exit code 1 if any failed
node scripts/run-all-tests.mjs api e2e   # only some suites, same summary
npm run test:cleanup    # remove leftovers of interrupted runs
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
| `TEST_TIMEOUT_MS`, `TEST_HOOK_TIMEOUT_MS` | optional | API test / hook timeout (default 120000 / 300000) |
| `E2E_TEST_TIMEOUT_MS`, `E2E_EXPECT_TIMEOUT_MS`, `E2E_NAVIGATION_TIMEOUT_MS`, `E2E_ACTION_TIMEOUT_MS`, `E2E_SERVER_TIMEOUT_MS` | optional | E2E timeouts (defaults 240000, 45000, 120000, 60000, 300000) |
| `TEST_DB_CONNECTION_LIMIT`, `TEST_DB_POOL_TIMEOUT_S`, `TEST_DB_CONNECT_TIMEOUT_S` | optional | Prisma pool settings added to `DATABASE_URL` in tests (defaults 3, 120, 60) |
| `TEST_DB_RETRIES` | optional | attempts for unreachable-DB errors (default 6 = 1 try + 5 retries) |
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
  helpers/    env.ts (test env, timeouts, pool settings, DB write guard), db.ts (wait/retry
              for a remote DB), fake-services.ts, http.ts (call a handler, sign a webhook),
              session.ts (mock auth())
  cleanup-cli.ts   `npm run test:cleanup`
scripts/run-all-tests.mjs   `npm run test:all`
  setup/      Vitest setup files
```

## Writing new tests

1. Add the case to `TEST_PLAN.md` (next free ID), then name the test `"<ID> …"`.
2. Create data only with `tests/fixtures/factory.ts` (or include `RUN_ID` / `uid()` in
   every email, slug, name and code) so cleanup can find it.
3. Never assume the database is empty or assert on global totals: the live shop has
   real products, categories, orders and coupons. Filter results to your own ids.
4. Create fixtures one by one (no `Promise.all` of writes) and avoid loops of hundreds
   of API calls; seed bulk rows with `createMany` in one round trip.
5. A bug fix comes with a test that fails before the fix.
