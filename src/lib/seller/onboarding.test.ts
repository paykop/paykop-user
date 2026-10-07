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

  it("blocks when payout account is missing or unverified", () => {
    expect(
      listingsBlockReason({
        is_onboarded: true,
        has_subscription: true,
        kyc_status: "verified",
        seller_ready_missing: ["payout_account"],
      })
    ).toBe("Add and verify a payout bank account or UPI ID first.");
  });

  it("blocks when platform commission debt limit is exceeded", () => {
    expect(
      listingsBlockReason({
        is_onboarded: true,
        has_subscription: true,
        kyc_status: "verified",
        seller_ready_missing: ["debt_limit_exceeded"],
      })
    ).toBe("Platform commission debt limit exceeded; please settle outstanding dues.");
  });

  it("allows listings when full readiness gates pass", () => {
    expect(
      listingsBlockReason({
        ready: true,
        is_seller_ready: true,
        checks: {
          profile: { required: true, completed: true },
          profile_photo: { required: true, completed: true },
          kyc: { required: true, completed: true, verified: true },
          payout_account: { required: true, completed: true, verified: true },
          subscription: { required: true, active: true },
          debt_limit: { passed: true },
        },
      })
    ).toBeNull();
  });
});

