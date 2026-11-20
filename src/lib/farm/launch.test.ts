import { describe, it, expect, vi, beforeEach } from "vitest";
import { isAgriSearchQuery, isFarmVertical, openFarmModal, launchFarmApp } from "./launch";
import { session } from "@/lib/auth/session";
import { api } from "@/lib/api/endpoints";

vi.mock("@/lib/auth/session", () => ({
  session: {
    isAuthenticated: vi.fn(),
  },
}));

vi.mock("@/lib/api/endpoints", () => ({
  api: {
    auth: {
      createHandoff: vi.fn(),
    },
  },
}));

describe("launch.ts - Paykop Farm Domain Isolation & Launch Utilities", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (globalThis as any).window = {
      dispatchEvent: vi.fn(),
      location: { href: "" },
    };
    (globalThis as any).CustomEvent = class CustomEvent {
      type: string;
      detail: any;
      constructor(type: string, options?: { detail: any }) {
        this.type = type;
        this.detail = options?.detail;
      }
    };
  });

  describe("isAgriSearchQuery", () => {
    it("identifies agricultural keywords accurately", () => {
      expect(isAgriSearchQuery("fresh organic tomatoes")).toBe(true);
      expect(isAgriSearchQuery("wheat and paddy harvest")).toBe(true);
      expect(isAgriSearchQuery("Looking for vegetable seeds")).toBe(true);
      expect(isAgriSearchQuery("Farm produce")).toBe(true);
      expect(isAgriSearchQuery("onions and potatoes")).toBe(true);
    });

    it("returns false for non-agricultural search queries", () => {
      expect(isAgriSearchQuery("laptop repair service")).toBe(false);
      expect(isAgriSearchQuery("leather shoes and sneakers")).toBe(false);
      expect(isAgriSearchQuery("emergency blood request")).toBe(false);
      expect(isAgriSearchQuery("")).toBe(false);
      expect(isAgriSearchQuery(null)).toBe(false);
      expect(isAgriSearchQuery(undefined)).toBe(false);
    });
  });

  describe("isFarmVertical", () => {
    it("returns true only for entities marked with vertical: 'farm'", () => {
      expect(isFarmVertical({ vertical: "farm" })).toBe(true);
      expect(isFarmVertical({ vertical: "paykop" })).toBe(false);
      expect(isFarmVertical({})).toBe(false);
      expect(isFarmVertical(null)).toBe(false);
    });
  });

  describe("openFarmModal", () => {
    it("dispatches paykop_open_farm_modal event", () => {
      const dispatchSpy = vi.spyOn(window, "dispatchEvent");
      openFarmModal({ productId: 123 });
      expect(dispatchSpy).toHaveBeenCalled();
      const event = dispatchSpy.mock.calls[0][0] as CustomEvent;
      expect(event.type).toBe("paykop_open_farm_modal");
      expect(event.detail).toEqual({ productId: 123 });
    });
  });

  describe("launchFarmApp", () => {
    it("generates 60s SSO handoff code when user is authenticated", async () => {
      vi.mocked(session.isAuthenticated).mockReturnValue(true);
      vi.mocked(api.auth.createHandoff).mockResolvedValue({
        code: "test_handoff_code_123",
        expires_in: 60,
        target_app: "farm",
      });

      const res = await launchFarmApp({ productId: 456, fallbackToModal: false });
      expect(api.auth.createHandoff).toHaveBeenCalledWith("farm");
      expect(res.handoffCode).toBe("test_handoff_code_123");
      expect(res.deepLink).toContain("paykopfarm://auth?code=test_handoff_code_123&productId=456");
    });

    it("generates simple deep link when user is unauthenticated", async () => {
      vi.mocked(session.isAuthenticated).mockReturnValue(false);

      const res = await launchFarmApp({ productId: 789, fallbackToModal: false });
      expect(api.auth.createHandoff).not.toHaveBeenCalled();
      expect(res.handoffCode).toBeUndefined();
      expect(res.deepLink).toBe("paykopfarm://product/789");
    });
  });
});
