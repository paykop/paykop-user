import { describe, expect, it } from "vitest";
import { listingsBlockReason } from "./onboarding";

describe("listingsBlockReason", () => {
  it("blocks when next_onboarding_step is still in progress", () => {
    expect(
      listingsBlockReason({
        next_onboarding_step: "set_business_location",
        is_onboarded: true,
        has_subscription: true,
        kyc_status: "verified",
        is_seller_ready: false,
      })
    ).toBe("Set your business location first.");
  });

  it("allows listings when next_onboarding_step is ready", () => {
    expect(
      listingsBlockReason({
        next_onboarding_step: "ready",
        is_seller_ready: true,
      })
    ).toBeNull();
  });
});
