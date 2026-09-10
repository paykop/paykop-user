import { CachedSellerPaymentIntent } from "@/lib/agent/onboarding";

interface RazorpaySuccessResponse {
  razorpay_payment_id: string;
  razorpay_order_id?: string;
  razorpay_signature?: string;
}

interface RazorpayFailureResponse {
  error: { description?: string; code?: string; reason?: string };
}

interface RazorpayInstance {
  open: () => void;
  on: (
    event: "payment.failed",
    handler: (response: RazorpayFailureResponse) => void
  ) => void;
}

/** Subscription checkouts use subscription_id; order checkouts use order_id. */
type AgentRazorpayOptions = {
  key: string;
  amount?: number;
  currency: string;
  name: string;
  description: string;
  order_id?: string;
  subscription_id?: string;
  prefill: { name: string; email: string; contact: string };
  theme: { color: string };
  handler: (response: RazorpaySuccessResponse) => void | Promise<void>;
  modal: { ondismiss: () => void };
};

function getRazorpay(): new (options: AgentRazorpayOptions) => RazorpayInstance {
  return window.Razorpay as unknown as new (options: AgentRazorpayOptions) => RazorpayInstance;
}

export type SellerCheckoutPrefill = {
  name: string;
  email?: string;
  contact?: string;
};

function ensureRazorpayScript(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Razorpay requires a browser"));
  }
  if (window.Razorpay) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
    );
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Failed to load Razorpay SDK")));
      if (window.Razorpay) resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Razorpay SDK"));
    document.body.appendChild(script);
  });
}

export type SubscriptionCheckoutPayment = {
  plan_id?: number;
  plan_name?: string;
  amount?: number;
  currency?: string;
  provider_ref?: string;
  razorpay_order_id?: string;
  razorpay_subscription_id?: string;
};

/**
 * Open Razorpay for a seller subscription intent (agent-managed or self-serve).
 * Prefer subscription_id; fall back to order_id.
 * For subscriptions, amount MUST NOT be passed to Razorpay checkout options.
 */
export async function openSellerSubscriptionCheckout(opts: {
  payment: SubscriptionCheckoutPayment;
  prefill: SellerCheckoutPrefill;
  description?: string;
  onPaid: () => void;
  onDismiss?: () => void;
  onFailure?: (error: unknown) => void;
}): Promise<void> {
  const rzpKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  if (!rzpKey) {
    throw new Error("Online payments are not configured.");
  }

  const subId = opts.payment.razorpay_subscription_id;
  const orderId = opts.payment.razorpay_order_id;
  if (!subId && !orderId) {
    throw new Error("Payment checkout id missing from server.");
  }

  await ensureRazorpayScript();
  if (!window.Razorpay) {
    throw new Error("Razorpay checkout is still loading. Please try again.");
  }

  const cleanContact = (opts.prefill.contact || "")
    .replace(/^\+91|^91/, "")
    .replace(/\D/g, "")
    .slice(-10);

  const options: AgentRazorpayOptions = {
    key: rzpKey,
    currency: opts.payment.currency || "INR",
    name: "Paykop Hyperlocal",
    description: opts.description || "Seller subscription",
    prefill: {
      name: opts.prefill.name,
      email: opts.prefill.email || "",
      contact: cleanContact,
    },
    theme: { color: "#1e3a8a" },
    handler: async () => {
      opts.onPaid();
    },
    modal: {
      ondismiss: () => {
        opts.onDismiss?.();
      },
    },
  };

  if (subId) {
    // Razorpay Subscriptions derives the amount from the subscription entity on server.
    // Passing 'amount' alongside subscription_id throws an error in Razorpay Checkout.
    options.subscription_id = subId;
  } else if (orderId) {
    options.order_id = orderId;
    if (opts.payment.amount) {
      options.amount = opts.payment.amount;
    }
  }

  const rzp = new (getRazorpay())(options);
  rzp.on("payment.failed", (response) => {
    opts.onFailure?.(response.error);
  });
  rzp.open();
}

export const openSubscriptionCheckout = openSellerSubscriptionCheckout;
