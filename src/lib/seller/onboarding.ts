import type { ReadinessChecks } from "@/types";

export type SellerWizardStep =
  | "complete_profile"
  | "choose_subscription"
  | "complete_subscription_payment"
  | "complete_kyc"
  | "await_kyc_review"
  | "set_business_location"
  | "listings";

export type OnboardingSubject = {
  next_onboarding_step?: string;
  is_onboarded?: boolean;
  has_subscription?: boolean;
  kyc_status?: string;
  is_seller_ready?: boolean;
  seller_ready_missing?: string[];
  missing?: string[];
  checks?: ReadinessChecks;
  ready?: boolean;
};

export const SELLER_WIZARD_STEPS: { id: SellerWizardStep; label: string }[] = [
  { id: "complete_profile", label: "Profile" },
  { id: "choose_subscription", label: "Plan" },
  { id: "complete_kyc", label: "KYC" },
  { id: "set_business_location", label: "Location" },
  { id: "listings", label: "Listings" },
];

/**
 * Derive the active UI step from backend next_onboarding_step.
 * Clients must render only this step (one-at-a-time).
 */
export function deriveWizardStep(seller: OnboardingSubject): SellerWizardStep {
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
  if (!apiStep && !seller.has_subscription && seller.is_onboarded) {
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

  if (!seller.is_onboarded) return "complete_profile";
  if (!seller.has_subscription) return "choose_subscription";
  if (seller.kyc_status === "pending") return "await_kyc_review";
  if (seller.kyc_status !== "verified") return "complete_kyc";
  if (seller.is_seller_ready === true) return "listings";
  return "set_business_location";
}

export function isOnboardingComplete(step: SellerWizardStep): boolean {
  return step === "listings";
}

export function wizardStepIndex(step: SellerWizardStep): number {
  if (step === "complete_subscription_payment") return 1;
  if (step === "await_kyc_review") return 2;
  return SELLER_WIZARD_STEPS.findIndex((s) => s.id === step);
}

export function isSellerReadyForListings(seller: OnboardingSubject): boolean {
  if (seller.next_onboarding_step === "ready") return true;
  if (seller.ready === true && seller.is_seller_ready !== false) return true;
  if (seller.next_onboarding_step && seller.next_onboarding_step !== "ready") return false;
  if (seller.is_seller_ready === true) return true;
  return !!seller.is_onboarded && !!seller.has_subscription && seller.kyc_status === "verified";
}

export function listingsBlockReason(seller: OnboardingSubject): string | null {
  if (seller.next_onboarding_step === "ready") return null;
  if (seller.ready === true && seller.is_seller_ready !== false) return null;

  if (seller.next_onboarding_step && seller.next_onboarding_step !== "ready") {
    if (seller.next_onboarding_step === "complete_profile") {
      return "Complete your seller profile first.";
    }
    if (
      seller.next_onboarding_step === "choose_subscription" ||
      seller.next_onboarding_step === "complete_subscription_payment"
    ) {
      return "Subscribe to a seller plan first.";
    }
    if (
      seller.next_onboarding_step === "complete_kyc" ||
      seller.next_onboarding_step === "await_kyc_review"
    ) {
      return "Complete seller KYC first.";
    }
    if (seller.next_onboarding_step === "set_business_location") {
      return "Set your business location first.";
    }
  }

  // Check 6-point verification gates if present
  if (seller.checks) {
    if (!seller.checks.profile.completed) return "Complete your seller profile first.";
    if (!seller.checks.profile_photo.completed) return "Upload a store profile photo first.";
    if (!seller.checks.kyc.completed || !seller.checks.kyc.verified) return "Complete seller KYC first.";
    if (!seller.checks.payout_account.completed || !seller.checks.payout_account.verified) {
      return "Add and verify a payout bank account or UPI ID first.";
    }
    if (!seller.checks.subscription.active) return "Subscribe to a seller plan first.";
    if (!seller.checks.debt_limit.passed) {
      return "Platform commission debt limit exceeded; please settle outstanding dues.";
    }
  }

  // Check missing checklists
  if (
    seller.seller_ready_missing?.includes("payout_account") ||
    seller.missing?.includes("payout_account")
  ) {
    return "Add and verify a payout bank account or UPI ID first.";
  }
  if (
    seller.seller_ready_missing?.includes("debt_limit_exceeded") ||
    seller.missing?.includes("debt_limit")
  ) {
    return "Platform commission debt limit exceeded; please settle outstanding dues.";
  }
  if (seller.missing?.includes("profile_photo")) {
    return "Upload a store profile photo first.";
  }

  if (!seller.is_onboarded) return "Complete your seller profile first.";
  if (!seller.has_subscription) return "Subscribe to a seller plan first.";
  if (seller.kyc_status !== "verified") return "Complete seller KYC first.";
  if (seller.is_seller_ready === false) return "Finish onboarding steps before listing.";
  return null;
}

export function onboardingStepHref(step: SellerWizardStep): string | null {
  switch (step) {
    case "complete_profile":
      return "/onboarding";
    case "choose_subscription":
    case "complete_subscription_payment":
      return "/seller";
    case "complete_kyc":
    case "await_kyc_review":
      return "/seller/kyc";
    case "set_business_location":
      return "/seller/location";
    case "listings":
      return null;
    default:
      return "/seller";
  }
}
