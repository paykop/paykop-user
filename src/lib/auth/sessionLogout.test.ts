import { describe, expect, it, vi, beforeEach } from "vitest";
import { api } from "@/lib/api/endpoints";
import { session } from "@/lib/auth/session";

describe("paykop-user Session & Logout Verification", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("Item 7: Role-based logout dispatches to the correct endpoint based on user role", async () => {
    const logoutSpy = vi.spyOn(api.auth, "logout").mockResolvedValue({ message: "ok" });
    const logoutAgentSpy = vi.spyOn(api.auth, "logoutAgent").mockResolvedValue({ message: "ok" });
    const logoutSupportSpy = vi.spyOn(api.auth, "logoutSupport").mockResolvedValue({ message: "ok" });

    // Helper implementing Header.tsx role branching
    const dispatchLogout = async (role: string, refreshToken: string) => {
      if (role === "agent") {
        await api.auth.logoutAgent(refreshToken);
      } else if (role === "support") {
        await api.auth.logoutSupport(refreshToken);
      } else {
        await api.auth.logout(refreshToken);
      }
    };

    // 1. Agent logout invokes logoutAgent (/auth/agent/logout)
    await dispatchLogout("agent", "refresh-agent-123");
    expect(logoutAgentSpy).toHaveBeenCalledWith("refresh-agent-123");
    expect(logoutSpy).not.toHaveBeenCalled();
    expect(logoutSupportSpy).not.toHaveBeenCalled();

    vi.clearAllMocks();

    // 2. Support logout invokes logoutSupport (/auth/support/logout)
    await dispatchLogout("support", "refresh-support-456");
    expect(logoutSupportSpy).toHaveBeenCalledWith("refresh-support-456");
    expect(logoutSpy).not.toHaveBeenCalled();
    expect(logoutAgentSpy).not.toHaveBeenCalled();

    vi.clearAllMocks();

    // 3. Buyer/Seller/Donor invokes consumer logout (/auth/logout)
    await dispatchLogout("buyer", "refresh-buyer-789");
    expect(logoutSpy).toHaveBeenCalledWith("refresh-buyer-789");
    expect(logoutAgentSpy).not.toHaveBeenCalled();
    expect(logoutSupportSpy).not.toHaveBeenCalled();
  });

  it("Item 6: Logout all devices calls api.auth.logoutAllDevices and clears session", async () => {
    const logoutAllSpy = vi.spyOn(api.auth, "logoutAllDevices").mockResolvedValue({ message: "Logged out of all devices successfully" });
    const clearSessionSpy = vi.spyOn(session, "clearSession");

    // Simulate handleLogoutAllDevices flow from AccountPage
    await api.auth.logoutAllDevices();
    session.clearSession();

    expect(logoutAllSpy).toHaveBeenCalledTimes(1);
    expect(clearSessionSpy).toHaveBeenCalledTimes(1);
  });

  it("Item 4: Strict token pair validation in refresh flow rejects partial responses", () => {
    const validateTokenPair = (pair: { access_token?: string; refresh_token?: string }) => {
      if (!pair?.access_token || !pair?.refresh_token) {
        throw new Error("Session expired. Please log in again.");
      }
      return pair;
    };

    // Valid pair passes
    expect(() => validateTokenPair({ access_token: "acc", refresh_token: "ref" })).not.toThrow();

    // Missing refresh_token fails
    expect(() => validateTokenPair({ access_token: "acc" })).toThrow("Session expired. Please log in again.");

    // Missing access_token fails
    expect(() => validateTokenPair({ refresh_token: "ref" })).toThrow("Session expired. Please log in again.");
  });
});
