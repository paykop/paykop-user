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

/**
 * Open Razorpay for an agent-initiated seller subscription intent.
 * Prefer subscription_id; fall back to order_id. Does not call createIntent or confirm
 * (agent cannot confirm seller payments — webhook + poll instead).
 */
export async function openSellerSubscriptionCheckout(opts: {
  payment: CachedSellerPaymentIntent;
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

  const options: AgentRazorpayOptions = {
    key: rzpKey,
    amount: opts.payment.amount,
    currency: opts.payment.currency || "INR",
    name: "Paykop Hyperlocal",
    description: opts.description || "Seller subscription",
    prefill: {
      name: opts.prefill.name,
      email: opts.prefill.email || "",
      contact: (opts.prefill.contact || "").replace(/^\+/, ""),
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
    options.subscription_id = subId;
  } else if (orderId) {
    options.order_id = orderId;
  }

  const rzp = new (getRazorpay())(options);
  rzp.on("payment.failed", (response) => {
    opts.onFailure?.(response.error);
  });
  rzp.open();
}
