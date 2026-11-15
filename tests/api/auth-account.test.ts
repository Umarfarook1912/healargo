import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { describe, expect, it } from "vitest";
import { prisma } from "@/lib/db/prisma";
import { POST as register } from "@/app/api/auth/register/route";
import { POST as forgot } from "@/app/api/auth/forgot-password/route";
import { POST as reset } from "@/app/api/auth/reset-password/route";
import { GET as getProfile, PUT as putProfile } from "@/app/api/user/profile/route";
import { PUT as changePassword } from "@/app/api/user/password/route";
import * as addresses from "@/app/api/user/addresses/route";
import { upsertGoogleUser } from "@/lib/auth/users";
import { createUser, shippingAddress, TEST_PASSWORD } from "../fixtures/factory";
import { testEmail } from "../fixtures/run";
import { call, settle } from "../helpers/http";
import { actAs } from "../helpers/session";
import { fake } from "../helpers/fake";

describe("register (POST /api/auth/register)", () => {
  it("AUTH-001 creates a lower-cased user with a bcrypt hash", async () => {
    const email = testEmail("Ravi").replace("test+", "Test+");
    const res = await call(register, { body: { name: "Ravi K", email, password: "secret1", phone: "9876543210" } });
    expect(res.status).toBe(200);
    expect(res.json.data.role).toBe("user");
    const user = await prisma.user.findUniqueOrThrow({ where: { email: email.toLowerCase() } });
    expect(user.passwordHash).not.toBe("secret1");
    expect(await bcrypt.compare("secret1", user.passwordHash!)).toBe(true);
    expect(user.phone).toBe("9876543210");
  });

  it("AUTH-002 duplicate email in any case is 409", async () => {
    const existing = await createUser();
    const res = await call(register, { body: { name: "Dup", email: existing.email.toUpperCase(), password: "secret1" } });
    expect(res.status).toBe(409);
    expect(res.json.error).toBe("Email already registered");
    expect(await prisma.user.count({ where: { email: existing.email } })).toBe(1);
  });

  it.each([
    ["bad email", { name: "Ravi", email: "nope", password: "secret1" }],
    ["short password", { name: "Ravi", email: testEmail(), password: "12345" }],
    ["short name", { name: "R", email: testEmail(), password: "secret1" }],
    ["missing fields", {}],
  ])("AUTH-003 rejects %s", async (_l, body) => {
    const res = await call(register, { body });
    expect(res.status).toBe(400);
    expect(res.json.error).toBe("Please check the form and try again");
  });

  it("AUTH-004 cannot self-assign admin", async () => {
    const email = testEmail("selfadmin");
    const res = await call(register, { body: { name: "Sneaky", email, password: "secret1", role: "admin" } });
    expect(res.status).toBe(200);
    expect((await prisma.user.findUniqueOrThrow({ where: { email } })).role).toBe("user");
  });
});

describe("Google users (upsertGoogleUser)", () => {
  it("AUTH-014 creates a user with a fallback name and no password", async () => {
    const email = testEmail("NewG").replace("test+", "TEST+");
    const user = await upsertGoogleUser({ email, name: "", image: "x" });
    expect(user).toBeTruthy();
    const saved = await prisma.user.findUniqueOrThrow({ where: { email: email.toLowerCase() } });
    expect(saved.role).toBe("user");
    expect(saved.name.length).toBeGreaterThan(0);
    expect(saved.image).toBe("x");
    expect(saved.passwordHash).toBeNull();
  });

  it("AUTH-015 an existing admin keeps the admin role", async () => {
    const admin = await createUser({ role: "admin" });
    await upsertGoogleUser({ email: admin.email, name: "Admin", image: "new.png" });
    const saved = await prisma.user.findUniqueOrThrow({ where: { id: admin.id } });
    expect(saved.role).toBe("admin");
    expect(saved.image).toBe("new.png");
    expect(await prisma.user.count({ where: { email: admin.email } })).toBe(1);
  });

  it("AUTH-016 no email returns null", async () => {
    await expect(upsertGoogleUser({ email: null, name: "x", image: null })).resolves.toBeNull();
  });
});

describe("forgot / reset password", () => {
  it("AUTH-020 stores only a hash and emails the link", async () => {
    const user = await createUser();
    const res = await call(forgot, { body: { email: user.email.toUpperCase() } });
    expect(res.status).toBe(200);
    expect(res.text).not.toMatch(/[0-9a-f]{64}/);
    await settle();
    const mail = fake().state.emails.find((e) => e.to === user.email);
    expect(mail).toBeTruthy();
    const token = /reset-password\?token=([0-9a-f]{64})/.exec(mail!.text + (mail!.html ?? ""))?.[1];
    expect(token).toBeTruthy();
    const saved = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    expect(saved.passwordResetTokenHash).toBe(crypto.createHash("sha256").update(token!).digest("hex"));
    const ttl = saved.passwordResetExpiresAt!.getTime() - Date.now();
    expect(ttl).toBeGreaterThan(55 * 60_000);
    expect(ttl).toBeLessThanOrEqual(60 * 60_000);
  });

  it("AUTH-021 unknown email: same answer, no email", async () => {
    const known = await createUser();
    const a = await call(forgot, { body: { email: known.email } });
    const b = await call(forgot, { body: { email: testEmail("ghost") } });
    expect(b.status).toBe(200);
    expect(b.json.data.message).toBe(a.json.data.message);
    await settle();
    expect(fake().state.emails.filter((e) => e.to.includes("ghost"))).toHaveLength(0);
  });

  it("AUTH-022 Google-only user gets no token", async () => {
    const g = await createUser({ password: null });
    expect((await call(forgot, { body: { email: g.email } })).status).toBe(200);
    expect((await prisma.user.findUniqueOrThrow({ where: { id: g.id } })).passwordResetTokenHash).toBeNull();
  });

  it("AUTH-023 bad email is 400", async () => {
    const res = await call(forgot, { body: { email: "x" } });
    expect(res.status).toBe(400);
    expect(res.json.error).toBe("Invalid email");
  });

  async function issueToken(userId: string, expiresInMs = 30 * 60_000) {
    const token = crypto.randomBytes(32).toString("hex");
    await prisma.user.update({
      where: { id: userId },
      data: {
        passwordResetTokenHash: crypto.createHash("sha256").update(token).digest("hex"),
        passwordResetExpiresAt: new Date(Date.now() + expiresInMs),
      },
    });
    return token;
  }

  it("AUTH-024 + AUTH-026 reset works once", async () => {
    const user = await createUser();
    const token = await issueToken(user.id);
    const res = await call(reset, { body: { token, newPassword: "newpass1" } });
    expect(res.status).toBe(200);
    const saved = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    expect(await bcrypt.compare("newpass1", saved.passwordHash!)).toBe(true);
    expect(await bcrypt.compare(TEST_PASSWORD, saved.passwordHash!)).toBe(false);
    expect(saved.passwordResetTokenHash).toBeNull();
    expect(saved.passwordResetExpiresAt).toBeNull();
    expect((await call(reset, { body: { token, newPassword: "another1" } })).status).toBe(400);
  });

  it("AUTH-025 expired token is rejected", async () => {
    const user = await createUser();
    const token = await issueToken(user.id, -60_000);
    const res = await call(reset, { body: { token, newPassword: "newpass1" } });
    expect(res.status).toBe(400);
    expect(res.json.error).toBe("Reset link is invalid or expired");
    const saved = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    expect(await bcrypt.compare(TEST_PASSWORD, saved.passwordHash!)).toBe(true);
  });

  it("AUTH-027 validation", async () => {
    expect((await call(reset, { body: { token: "a".repeat(19), newPassword: "newpass1" } })).json.error).toBe("Invalid reset request");
    expect((await call(reset, { body: { token: "a".repeat(64), newPassword: "12345" } })).status).toBe(400);
  });
});

describe("profile and password", () => {
  it("PRF-001 profile needs login and hides secrets", async () => {
    const user = await createUser();
    actAs(null);
    expect((await call(getProfile)).status).toBe(401);
    actAs(user);
    const res = await call(getProfile);
    expect(res.status).toBe(200);
    expect(res.json.data).toMatchObject({ name: user.name, email: user.email });
    expect(res.text).not.toMatch(/passwordHash|passwordReset/);
  });

  it("PRF-002 update changes only name and phone", async () => {
    const user = await createUser();
    actAs(user);
    const res = await call(putProfile, { method: "PUT", body: { name: "New Name", phone: "99", email: "x@y.z", role: "admin" } });
    expect(res.status).toBe(200);
    const saved = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    expect(saved).toMatchObject({ name: "New Name", phone: "99", email: user.email, role: "user" });
    expect((await call(putProfile, { method: "PUT", body: { name: "A" } })).status).toBe(400);
  });

  it("PRF-003 change password", async () => {
    const user = await createUser();
    actAs(user);
    const wrong = await call(changePassword, { method: "PUT", body: { currentPassword: "nope", newPassword: "newpass1" } });
    expect(wrong.json.error).toBe("Current password is incorrect");
    expect((await call(changePassword, { method: "PUT", body: { currentPassword: TEST_PASSWORD, newPassword: "12345" } })).status).toBe(400);
    expect((await call(changePassword, { method: "PUT", body: { currentPassword: TEST_PASSWORD, newPassword: "newpass1" } })).status).toBe(200);
    const saved = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    expect(await bcrypt.compare("newpass1", saved.passwordHash!)).toBe(true);
    const google = await createUser({ password: null });
    actAs(google);
    const g = await call(changePassword, { method: "PUT", body: { currentPassword: "x", newPassword: "newpass1" } });
    expect(g.json.error).toMatch(/only available for email accounts/);
  });
});

describe("addresses (/api/user/addresses)", () => {
  const addr = (o: Record<string, unknown> = {}) => shippingAddress(o);

  it("PRF-004 every method needs login", async () => {
    actAs(null);
    expect((await call(addresses.GET)).status).toBe(401);
    expect((await call(addresses.POST, { body: addr() })).status).toBe(401);
    expect((await call(addresses.PUT, { method: "PUT", body: { index: 0, ...addr() } })).status).toBe(401);
    expect((await call(addresses.DELETE, { method: "DELETE", path: "/api/user/addresses?index=0" })).status).toBe(401);
  });

  it("PRF-005 first address becomes default; a new default replaces it", async () => {
    const user = await createUser();
    actAs(user);
    let res = await call(addresses.POST, { body: addr({ line1: "A1 street" }) });
    expect(res.json.data[0].isDefault).toBe(true);
    res = await call(addresses.POST, { body: addr({ line1: "A2 street", isDefault: true }) });
    expect(res.json.data.map((a: { isDefault: boolean }) => a.isDefault)).toEqual([false, true]);
  });

  it("PRF-006 update by index and its validation", async () => {
    const user = await createUser();
    actAs(user);
    await call(addresses.POST, { body: addr() });
    await call(addresses.POST, { body: addr({ line1: "Second street" }) });
    expect((await call(addresses.PUT, { method: "PUT", body: { index: 1, ...addr({ city: "Madurai" }) } })).status).toBe(200);
    expect((await call(addresses.PUT, { method: "PUT", body: { index: 5, ...addr() } })).json.error).toBe("Address index out of bounds");
    expect((await call(addresses.PUT, { method: "PUT", body: { index: -1, ...addr() } })).json.error).toBe("Invalid address index");
    expect((await call(addresses.PUT, { method: "PUT", body: { index: "1", ...addr() } })).json.error).toBe("Invalid address index");
    expect((await call(addresses.PUT, { method: "PUT", body: { index: 0, ...addr({ pincode: "12" }) } })).json.error).toBe("Validation failed");
  });

  it("PRF-007 delete by index promotes the remaining address", async () => {
    const user = await createUser();
    actAs(user);
    await call(addresses.POST, { body: addr() });
    await call(addresses.POST, { body: addr({ line1: "Second street" }) });
    const res = await call(addresses.DELETE, { method: "DELETE", path: "/api/user/addresses?index=0" });
    expect(res.status).toBe(200);
    expect(res.json.data).toHaveLength(1);
    expect(res.json.data[0].isDefault).toBe(true);
    for (const q of ["?index=9", "?index=abc", ""]) {
      expect((await call(addresses.DELETE, { method: "DELETE", path: `/api/user/addresses${q}` })).status).toBe(400);
    }
  });

  it("PRF-008 users can only change their own address book", async () => {
    const a = await createUser();
    const b = await createUser();
    actAs(b);
    await call(addresses.POST, { body: addr({ line1: "B street" }) });
    const bBefore = (await prisma.user.findUniqueOrThrow({ where: { id: b.id } })).addresses;
    actAs(a);
    await call(addresses.POST, { body: addr({ line1: "A street" }) });
    await call(addresses.PUT, { method: "PUT", body: { index: 0, ...addr({ line1: "A changed" }) } });
    await call(addresses.DELETE, { method: "DELETE", path: "/api/user/addresses?index=0" });
    expect((await prisma.user.findUniqueOrThrow({ where: { id: b.id } })).addresses).toEqual(bBefore);
  });
});
