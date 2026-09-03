import { describe, expect, it, beforeEach } from "vitest";
import {
  cacheSellerPaymentIntent,
  clearCachedSellerPaymentIntent,
  deriveAgentWizardStep,
  getCachedSellerPaymentIntent,
  isSellerReadyForListings,
  listingsBlockReason,
  wizardStepIndex,
} from "./onboarding";

const memory = new Map<string, string>();

function installSessionStorage() {
  memory.clear();
  const mock = {
    getItem: (key: string) => memory.get(key) ?? null,
    setItem: (key: string, value: string) => {
      memory.set(key, value);
    },
    removeItem: (key: string) => {
      memory.delete(key);
    },
    clear: () => memory.clear(),
    key: (index: number) => Array.from(memory.keys())[index] ?? null,
    get length() {
      return memory.size;
    },
  };
  Object.defineProperty(globalThis, "sessionStorage", {
    value: mock,
    configurable: true,
    writable: true,
  });
}

describe("deriveAgentWizardStep", () => {
  it("starts at profile when not onboarded", () => {
    expect(
      deriveAgentWizardStep({
        is_onboarded: false,
        has_subscription: false,
        kyc_status: "unverified",
        next_onboarding_step: "complete_profile",
      })
    ).toBe("complete_profile");
  });

  it("moves to plan after profile", () => {
    expect(
      deriveAgentWizardStep({
        is_onboarded: true,
        has_subscription: false,
        kyc_status: "unverified",
        next_onboarding_step: "choose_subscription",
      })
    ).toBe("choose_subscription");
  });

  it("shows payment step for pending checkout", () => {
    expect(
      deriveAgentWizardStep({
        is_onboarded: true,
        has_subscription: false,
        kyc_status: "unverified",
        next_onboarding_step: "complete_subscription_payment",
      })
    ).toBe("complete_subscription_payment");
  });

  it("moves to kyc after subscription", () => {
    expect(
      deriveAgentWizardStep({
        is_onboarded: true,
        has_subscription: true,
        kyc_status: "unverified",
        next_onboarding_step: "complete_kyc",
      })
    ).toBe("complete_kyc");
  });

  it("shows set_business_location from API step", () => {
    expect(
      deriveAgentWizardStep({
        is_onboarded: true,
        has_subscription: true,
        kyc_status: "verified",
        next_onboarding_step: "set_business_location",
        is_seller_ready: true,
      })
    ).toBe("set_business_location");
  });

  it("reaches listings when API says ready", () => {
    expect(
      deriveAgentWizardStep({
        is_onboarded: true,
        has_subscription: true,
        kyc_status: "verified",
        next_onboarding_step: "ready",
        is_seller_ready: true,
      })
    ).toBe("listings");
  });
});

describe("listings gates", () => {
  it("blocks until next_onboarding_step is ready", () => {
    const seller = {
      is_onboarded: true,
      has_subscription: true,
      kyc_status: "verified" as const,
      is_seller_ready: true,
      next_onboarding_step: "set_business_location",
    };
    expect(isSellerReadyForListings(seller)).toBe(false);
    expect(listingsBlockReason(seller)).toMatch(/location/i);
    expect(
      listingsBlockReason({ ...seller, next_onboarding_step: "ready" })
    ).toBeNull();
    expect(isSellerReadyForListings({ ...seller, next_onboarding_step: "ready" })).toBe(
      true
    );
  });

  it("maps payment and await_kyc onto strip indices", () => {
    expect(wizardStepIndex("complete_subscription_payment")).toBe(1);
    expect(wizardStepIndex("await_kyc_review")).toBe(2);
    expect(wizardStepIndex("listings")).toBe(4);
    expect(wizardStepIndex("set_business_location")).toBe(3);
  });
});

describe("pending payment cache", () => {
  beforeEach(() => {
    installSessionStorage();
  });

  it("stores and clears payment intent for resume", () => {
    cacheSellerPaymentIntent(
      "s1",
      {
        id: 1,
        amount: 99900,
        currency: "INR",
        status: "pending",
        provider: "razorpay",
        provider_ref: "sub_abc",
        razorpay_subscription_id: "sub_abc",
      },
      { plan_id: 2, plan_name: "Pro" }
    );
    expect(getCachedSellerPaymentIntent("s1")?.razorpay_subscription_id).toBe("sub_abc");
    expect(getCachedSellerPaymentIntent("s1")?.plan_name).toBe("Pro");
    clearCachedSellerPaymentIntent("s1");
    expect(getCachedSellerPaymentIntent("s1")).toBeNull();
  });
});
