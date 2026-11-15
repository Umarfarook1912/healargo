import { describe, expect, it } from "vitest";
import { checkSeedAllowed } from "../../scripts/seed-guard";

describe("seed guard (SEC-seed)", () => {
  const good = { SEED_ADMIN_PASSWORD: "long-enough-pw" };
  it("refuses production", () => {
    expect(checkSeedAllowed({ ...good, NODE_ENV: "production" }, ["--confirm-wipe"]).ok).toBe(false);
    expect(checkSeedAllowed({ ...good, VERCEL_ENV: "production" }, ["--confirm-wipe"]).ok).toBe(false);
  });
  it("requires explicit confirmation", () => {
    expect(checkSeedAllowed(good, []).ok).toBe(false);
    expect(checkSeedAllowed({ ...good, SEED_CONFIRM: "wipe" }, []).ok).toBe(true);
    expect(checkSeedAllowed(good, ["--confirm-wipe"]).ok).toBe(true);
  });
  it("requires a strong admin password and defaults the email", () => {
    expect(checkSeedAllowed({ SEED_ADMIN_PASSWORD: "short" }, ["--confirm-wipe"]).ok).toBe(false);
    const res = checkSeedAllowed({ ...good, SEED_ADMIN_EMAIL: " Boss@Healargo.com " }, ["--confirm-wipe"]);
    expect(res.ok && res.config.adminEmail).toBe("boss@healargo.com");
    const def = checkSeedAllowed(good, ["--confirm-wipe"]);
    expect(def.ok && def.config.adminEmail).toBe("healargo@gmail.com");
  });
});
