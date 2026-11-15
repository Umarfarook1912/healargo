import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  session: null as null | { user: { id: string; role: string } },
  dbRole: undefined as string | undefined,
}));
vi.mock("@/lib/auth/auth", () => ({ auth: vi.fn(async () => mocks.session) }));
vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(async () => (mocks.dbRole ? { role: mocks.dbRole } : null)),
    },
  },
}));

import { authConfig } from "@/lib/auth/auth.config";
import { config as middlewareConfig } from "@/middleware";
import { requireAdmin } from "@/lib/auth/require-admin";
import { getPostLoginRoute, safeCallbackPath } from "@/lib/auth/post-login";
import { adminCreateUserSchema, credentialsSchema, registerSchema } from "@/lib/auth/schemas";

type AuthorizedArgs = Parameters<typeof authConfig.callbacks.authorized>[0];
function authorized(path: string, role: "anon" | "user" | "admin") {
  const auth = role === "anon" ? null : { user: { id: "u1", role }, expires: "" };
  return authConfig.callbacks.authorized({
    auth,
    request: { nextUrl: new URL(`http://localhost${path}`) },
  } as unknown as AuthorizedArgs);
}

describe("auth config", () => {
  it("AUTH-030 authorized() decision matrix", () => {
    const matrix: Array<[string, boolean, boolean, boolean]> = [
      ["/admin/x", false, false, true],
      ["/profile", false, true, true],
      ["/orders/1", false, true, true],
      ["/checkout", false, true, true],
      ["/shop", true, true, true],
      ["/", true, true, true],
    ];
    for (const [path, anon, user, admin] of matrix) {
      expect([authorized(path, "anon"), authorized(path, "user"), authorized(path, "admin")], path).toEqual([anon, user, admin]);
    }
  });

  it("AUTH-031 middleware matcher covers every protected area", () => {
    expect(middlewareConfig.matcher).toEqual([
      "/admin/:path*",
      "/profile",
      "/profile/:path*",
      "/orders",
      "/orders/:path*",
      "/checkout",
      "/checkout/:path*",
    ]);
  });

  it("AUTH-017 jwt and session callbacks", async () => {
    const { jwt, session } = authConfig.callbacks;
    const token = await jwt({ token: { picture: "p.png" }, user: { id: "u1", role: "admin" } } as never);
    expect(token).toMatchObject({ id: "u1", role: "admin" });
    const s = await session({ session: { user: { name: "A" } }, token } as never);
    expect((s as { user: Record<string, unknown> }).user).toMatchObject({ id: "u1", role: "admin", image: "p.png" });
    const noRole = await session({ session: { user: {} }, token: { id: "u2" } } as never);
    expect((noRole as { user: { role: string } }).user.role).toBe("user");
    const kept = await jwt({ token: { id: "u3", role: "user" } } as never);
    expect(kept).toMatchObject({ id: "u3", role: "user" });
  });

  it("AUTH-005 schema boundaries", () => {
    expect(credentialsSchema.safeParse({ email: "a@b.co", password: "123456" }).success).toBe(true);
    expect(credentialsSchema.safeParse({ email: "a@b.co", password: "12345" }).success).toBe(false);
    expect(registerSchema.safeParse({ name: "Al", email: "a@b.co", password: "123456" }).success).toBe(true);
    expect(registerSchema.safeParse({ name: "A", email: "a@b.co", password: "123456" }).success).toBe(false);
    const admin = adminCreateUserSchema.safeParse({ name: "Al", email: "a@b.co", password: "123456" });
    expect(admin.success && admin.data.role).toBe("user");
    expect(adminCreateUserSchema.safeParse({ name: "Al", email: "a@b.co", password: "123456", role: "root" }).success).toBe(false);
  });
});

describe("requireAdmin", () => {
  beforeEach(() => {
    mocks.session = null;
    mocks.dbRole = undefined;
  });

  it("AUTH-035 null, user and admin sessions", async () => {
    const res = await requireAdmin();
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.response.status).toBe(401);
      expect(await res.response.json()).toEqual({ error: "Unauthorized" });
    }
    mocks.session = { user: { id: "u1", role: "user" } };
    mocks.dbRole = "user";
    expect((await requireAdmin()).ok).toBe(false);
    mocks.session = { user: { id: "a1", role: "admin" } };
    mocks.dbRole = "admin";
    expect((await requireAdmin()).ok).toBe(true);
  });

  it("AUTH-037 a demoted or deleted admin with an old JWT is refused", async () => {
    mocks.session = { user: { id: "a1", role: "admin" } };
    mocks.dbRole = "user";
    expect((await requireAdmin()).ok).toBe(false);
    mocks.dbRole = undefined;
    expect((await requireAdmin()).ok).toBe(false);
  });
});

describe("post-login redirect (AUTH-038)", () => {
  const origin = "https://healargo.test";
  it.each([
    ["/checkout", "/checkout"],
    ["/orders/abc?x=1", "/orders/abc?x=1"],
    ["https://healargo.test/checkout", "/checkout"],
    ["https://evil.example/checkout", null],
    ["//evil.example", null],
    ["/\\evil.example", null],
    ["/login", null],
    ["/login?callbackUrl=/x", null],
    ["/register", null],
    ["javascript:alert(1)", null],
    ["", null],
    [undefined, null],
  ])("safeCallbackPath(%s) = %s", (input, expected) => {
    expect(safeCallbackPath(input as string | undefined, origin)).toBe(expected);
  });

  it("falls back to home", () => {
    expect(getPostLoginRoute("https://evil.example", origin)).toBe("/");
    expect(getPostLoginRoute("/checkout", origin)).toBe("/checkout");
  });
});
