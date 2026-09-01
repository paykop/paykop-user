import { describe, expect, it } from "vitest";
import { isSafeInternalRedirect } from "@/lib/auth/safeRedirect";
import { postLoginPath } from "@/lib/auth/postLogin";
import { User } from "@/types";

const buyer: User = {
  id: "1",
  phone: "9999999999",
  first_name: "Test",
  last_name: "User",
  role: "buyer",
  is_onboarded: true,
  has_subscription: false,
};

describe("isSafeInternalRedirect", () => {
  const origin = "https://paykop.com";

  it("allows safe internal paths", () => {
    expect(isSafeInternalRedirect("/account", origin)).toBe(true);
    expect(isSafeInternalRedirect("/checkout?product_id=1", origin)).toBe(true);
  });

  it("rejects open redirect tricks", () => {
    expect(isSafeInternalRedirect("/\\evil.com", origin)).toBe(false);
    expect(isSafeInternalRedirect("//evil.com", origin)).toBe(false);
    expect(isSafeInternalRedirect("/@evil.com", origin)).toBe(false);
    expect(isSafeInternalRedirect("/%5cevil.com", origin)).toBe(false);
    expect(isSafeInternalRedirect("https://evil.com", origin)).toBe(false);
  });
});

describe("postLoginPath", () => {
  it("uses safe redirect when valid", () => {
    expect(postLoginPath(buyer, "/account")).toBe("/account");
    expect(postLoginPath(buyer, "/checkout?product_id=1")).toBe("/checkout?product_id=1");
  });

  it("falls back when redirect is unsafe", () => {
    expect(postLoginPath(buyer, "/\\evil.com")).toBe("/");
    expect(postLoginPath(buyer, "//evil.com")).toBe("/");
  });

  it("sends unonboarded buyers to onboarding", () => {
    const unonboarded = { ...buyer, is_onboarded: false };
    expect(postLoginPath(unonboarded, null)).toBe("/onboarding");
  });

  it("sends agents to agent hub", () => {
    const agent = { ...buyer, role: "agent" as const };
    expect(postLoginPath(agent, null)).toBe("/agent");
  });
});
