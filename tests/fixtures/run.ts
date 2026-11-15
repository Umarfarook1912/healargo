/**
 * Every row a test creates carries the run marker, so cleanup can delete
 * exactly those rows from the shared database and nothing else.
 *
 *   MARKER   "hgtest"                       (also catches rows from crashed runs)
 *   RUN_ID   "hgtest<time><random>"         lower-case, used in slugs/emails/names
 *   COUPON   "HGTEST<...>"                  coupon codes are stored upper-case
 */
export const MARKER = "hgtest";

const g = globalThis as typeof globalThis & { __hgRunId?: string };
export const RUN_ID: string =
  process.env.TEST_RUN_ID ||
  (g.__hgRunId ??= `${MARKER}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`);

let counter = 0;
/** Unique, marker-carrying token for one fixture (e.g. "hgtestabc123-7"). */
export function uid(label = "x"): string {
  counter += 1;
  return `${RUN_ID}-${label}-${counter}`;
}

export function testEmail(label = "user"): string {
  return `test+${uid(label)}@healargo.test`;
}

export function testCouponCode(label = "C"): string {
  return uid(label).replace(/[^a-z0-9]/gi, "").toUpperCase();
}
