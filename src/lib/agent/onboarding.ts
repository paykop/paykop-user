import { PaymentIntentResponse } from "@/types";
import {
  type SellerWizardStep,
  deriveWizardStep,
  isOnboardingComplete,
  wizardStepIndex,
  isSellerReadyForListings,
  listingsBlockReason,
  SELLER_WIZARD_STEPS,
} from "@/lib/seller/onboarding";

/** @deprecated use SellerWizardStep */
export type AgentWizardStep = SellerWizardStep;

export const AGENT_WIZARD_STEPS = SELLER_WIZARD_STEPS;

export const deriveAgentWizardStep = deriveWizardStep;
export const isAgentOnboardingComplete = isOnboardingComplete;

export { wizardStepIndex, isSellerReadyForListings, listingsBlockReason };

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
    const payload: CachedSellerPaymentIntent = {
      plan_id: meta?.plan_id,
      plan_name: meta?.plan_name,
      amount: payment.amount,
      currency: payment.currency || "INR",
      provider_ref: payment.provider_ref,
      razorpay_order_id: payment.razorpay_order_id,
      razorpay_subscription_id: payment.razorpay_subscription_id,
    };
    const key = pendingPaymentStorageKey(sellerId);
    const val = JSON.stringify(payload);
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(key, val);
    }
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.setItem(key, val);
    }
  } catch {
    // ignore quota / private mode
  }
}

export function getCachedSellerPaymentIntent(
  sellerId: string
): CachedSellerPaymentIntent | null {
  try {
    const key = pendingPaymentStorageKey(sellerId);
    let raw: string | null = null;
    if (typeof localStorage !== "undefined") {
      raw = localStorage.getItem(key);
    }
    if (!raw && typeof sessionStorage !== "undefined") {
      raw = sessionStorage.getItem(key);
    }
    if (!raw) return null;
    return JSON.parse(raw) as CachedSellerPaymentIntent;
  } catch {
    return null;
  }
}

export function clearCachedSellerPaymentIntent(sellerId: string): void {
  try {
    const key = pendingPaymentStorageKey(sellerId);
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem(key);
    }
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.removeItem(key);
    }
  } catch {
    // ignore
  }
}
