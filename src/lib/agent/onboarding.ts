import { AgentSellerSummary, PaymentIntentResponse } from "@/types";

/** UI wizard steps for agent-managed seller onboarding. */
export type AgentWizardStep =
  | "complete_profile"
  | "choose_subscription"
  | "complete_subscription_payment"
  | "complete_kyc"
  | "await_kyc_review"
  | "set_business_location"
  | "listings";

const PENDING_PAY_PREFIX = "paykop-agent-subpay:";

export type CachedSellerPaymentIntent = {
  plan_id?: number;
  plan_name?: string;
  amount: number;
  currency: string;
  provider_ref: string;
  razorpay_order_id?: string;
  razorpay_subscription_id?: string;
};

export function pendingPaymentStorageKey(sellerId: string): string {
  return `${PENDING_PAY_PREFIX}${sellerId}`;
}

export function cacheSellerPaymentIntent(
  sellerId: string,
  payment: PaymentIntentResponse,
  meta?: { plan_id?: number; plan_name?: string }
): void {
  try {
    if (typeof sessionStorage === "undefined") return;
    const payload: CachedSellerPaymentIntent = {
      plan_id: meta?.plan_id,
      plan_name: meta?.plan_name,
      amount: payment.amount,
      currency: payment.currency || "INR",
      provider_ref: payment.provider_ref,
      razorpay_order_id: payment.razorpay_order_id,
      razorpay_subscription_id: payment.razorpay_subscription_id,
    };
    sessionStorage.setItem(pendingPaymentStorageKey(sellerId), JSON.stringify(payload));
  } catch {
    // ignore quota / private mode
  }
}

export function getCachedSellerPaymentIntent(
  sellerId: string
): CachedSellerPaymentIntent | null {
  try {
    if (typeof sessionStorage === "undefined") return null;
    const raw = sessionStorage.getItem(pendingPaymentStorageKey(sellerId));
    if (!raw) return null;
    return JSON.parse(raw) as CachedSellerPaymentIntent;
  } catch {
    return null;
  }
}

export function clearCachedSellerPaymentIntent(sellerId: string): void {
  try {
    if (typeof sessionStorage === "undefined") return;
    sessionStorage.removeItem(pendingPaymentStorageKey(sellerId));
  } catch {
    // ignore
  }
}

/**
 * Derive the active agent UI step from backend next_onboarding_step.
 * Clients must render only this step (one-at-a-time).
 */
export function deriveAgentWizardStep(
  seller: Pick<
    AgentSellerSummary,
    "next_onboarding_step" | "is_onboarded" | "has_subscription" | "kyc_status" | "is_seller_ready"
  >
): AgentWizardStep {
  const apiStep = seller.next_onboarding_step;

  if (apiStep === "complete_profile" || (!apiStep && !seller.is_onboarded)) {
    return "complete_profile";
  }
  if (apiStep === "complete_subscription_payment") {
    return "complete_subscription_payment";
  }
  if (apiStep === "choose_subscription") {
    return "choose_subscription";
  }
  if (
    !apiStep &&
    !seller.has_subscription &&
    seller.is_onboarded
  ) {
    return "choose_subscription";
  }
  if (apiStep === "await_kyc_review" || (!apiStep && seller.kyc_status === "pending")) {
    return "await_kyc_review";
  }
  if (
    apiStep === "complete_kyc" ||
    (!apiStep &&
      seller.has_subscription &&
      seller.kyc_status !== "verified" &&
      seller.kyc_status !== "pending")
  ) {
    return "complete_kyc";
  }
  if (apiStep === "set_business_location") {
    return "set_business_location";
  }
  if (apiStep === "ready") {
    return "listings";
  }

  // Fallbacks when next_onboarding_step is missing
  if (!seller.is_onboarded) return "complete_profile";
  if (!seller.has_subscription) return "choose_subscription";
  if (seller.kyc_status === "pending") return "await_kyc_review";
  if (seller.kyc_status !== "verified") return "complete_kyc";
  if (seller.is_seller_ready === true) return "listings";
  return "set_business_location";
}

export const AGENT_WIZARD_STEPS: { id: AgentWizardStep; label: string }[] = [
  { id: "complete_profile", label: "Profile" },
  { id: "choose_subscription", label: "Plan" },
  { id: "complete_kyc", label: "KYC" },
  { id: "set_business_location", label: "Location" },
  { id: "listings", label: "Listings" },
];

/** True when API ready maps to the listings wrap-up step (onboarding gates done). */
export function isAgentOnboardingComplete(step: AgentWizardStep): boolean {
  return step === "listings";
}

/** Map payment / await_kyc onto the strip index for progress UI. */
export function wizardStepIndex(step: AgentWizardStep): number {
  if (step === "complete_subscription_payment") return 1;
  if (step === "await_kyc_review") return 2;
  return AGENT_WIZARD_STEPS.findIndex((s) => s.id === step);
}

export function isSellerReadyForListings(
  seller: Pick<
    AgentSellerSummary,
    "next_onboarding_step" | "is_seller_ready" | "is_onboarded" | "has_subscription" | "kyc_status"
  >
): boolean {
  if (seller.next_onboarding_step === "ready") return true;
  if (seller.next_onboarding_step && seller.next_onboarding_step !== "ready") return false;
  if (seller.is_seller_ready === true) return true;
  return !!seller.is_onboarded && !!seller.has_subscription && seller.kyc_status === "verified";
}

export function listingsBlockReason(
  seller: Pick<
    AgentSellerSummary,
    "next_onboarding_step" | "is_onboarded" | "has_subscription" | "kyc_status" | "is_seller_ready"
  >
): string | null {
  if (seller.next_onboarding_step === "ready") return null;
  if (seller.next_onboarding_step && seller.next_onboarding_step !== "ready") {
    if (seller.next_onboarding_step === "complete_profile") {
      return "Complete the seller profile first.";
    }
    if (
      seller.next_onboarding_step === "choose_subscription" ||
      seller.next_onboarding_step === "complete_subscription_payment"
    ) {
      return "Subscribe the seller to a plan first.";
    }
    if (
      seller.next_onboarding_step === "complete_kyc" ||
      seller.next_onboarding_step === "await_kyc_review"
    ) {
      return "Complete and approve seller KYC first.";
    }
    if (seller.next_onboarding_step === "set_business_location") {
      return "Set the seller business location first.";
    }
  }
  if (!seller.is_onboarded) return "Complete the seller profile first.";
  if (!seller.has_subscription) return "Subscribe the seller to a plan first.";
  if (seller.kyc_status !== "verified") return "Complete and approve seller KYC first.";
  if (seller.is_seller_ready === false) return "Seller is not ready yet. Finish onboarding steps.";
  return null;
}
