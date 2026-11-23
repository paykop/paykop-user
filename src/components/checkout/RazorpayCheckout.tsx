"use client";

import { useEffect, useState } from "react";
import { Loader2, ShieldCheck } from "lucide-react";
import { api } from "@/lib/api/endpoints";
import { toast } from "@/lib/toast";
import { session } from "@/lib/auth/session";

interface RazorpaySuccessResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
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

interface RazorpayOptions {
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
}

type RazorpayConstructor = new (options: RazorpayOptions) => RazorpayInstance;

declare global {
  interface Window {
    Razorpay: RazorpayConstructor;
  }
}

interface RazorpayCheckoutProps {
  orderId?: number;
  orderGroupId?: string;
  bookingId?: number;
  campaignId?: number;
  subscriptionId?: number;
  /** Display amount / fallback if intent omits amount. Never sent on createIntent. */
  amountPaise: number;
  title: string;
  description?: string;
  onSuccess: (paymentId: string) => void;
  onFailure?: (error: unknown) => void;
  onDismiss?: () => void;
  buttonText?: string;
  buttonClassName?: string;
  disabled?: boolean;
}

export function RazorpayCheckout({
  orderId,
  orderGroupId,
  bookingId,
  campaignId,
  subscriptionId,
  amountPaise,
  title,
  description,
  onSuccess,
  onFailure,
  onDismiss,
  buttonText = "Pay with Razorpay",
  buttonClassName = "w-full py-4 px-6 rounded-full shopcart-btn-primary font-bold text-sm flex items-center justify-center gap-2 shadow-lg cursor-pointer",
  disabled = false,
}: RazorpayCheckoutProps) {
  const [loading, setLoading] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(
    () => typeof window !== "undefined" && !!window.Razorpay
  );

  useEffect(() => {
    if (scriptLoaded) return;

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => setScriptLoaded(true);
    script.onerror = () => {
      console.error("Failed to load Razorpay SDK");
    };
    document.body.appendChild(script);

    return () => {
      // Keep script in document
    };
  }, [scriptLoaded]);

  const handlePayment = async () => {
    if (!session.isAuthenticated()) {
      window.dispatchEvent(new CustomEvent("paykop_open_login"));
      return;
    }

    if (!orderId && !orderGroupId && !bookingId && !campaignId && !subscriptionId) {
      toast.error("Payment requires a linked order, booking, campaign, or subscription.");
      return;
    }

    if (!window.Razorpay) {
      toast.error("Razorpay checkout is still loading. Please try again in a moment.");
      return;
    }

    setLoading(true);

    try {
      // Amount is resolved server-side from the linked entity — never send client amount.
      const intent = await api.payments.createIntent({
        order_id: orderId,
        order_group_id: orderGroupId,
        booking_id: bookingId,
        campaign_id: campaignId,
        subscription_id: subscriptionId,
        provider: "razorpay",
        currency: "INR",
      });

      const user = session.getUser();
      const rzpKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
      if (!rzpKey) {
        throw new Error("Online payments are not configured.");
      }

      if (!intent.razorpay_order_id && !intent.razorpay_subscription_id) {
        throw new Error("Payment order ID missing from server.");
      }

      const cleanContact = (user?.phone || "")
        .replace(/^\+91|^91/, "")
        .replace(/\D/g, "")
        .slice(-10);

      const options: RazorpayOptions = {
        key: rzpKey,
        currency: intent.currency || "INR",
        name: "Paykop Hyperlocal",
        description: description || title,
        prefill: {
          name: user ? `${user.first_name} ${user.last_name}` : "",
          email: user?.email || "",
          contact: cleanContact,
        },
        theme: {
          color: "#1e3a8a",
        },
        handler: async function (response: RazorpaySuccessResponse) {
          try {
            if (intent.razorpay_order_id && response.razorpay_order_id) {
              await api.payments.confirm({
                provider_ref: intent.provider_ref,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
              });
            }

            onSuccess(response.razorpay_payment_id);
          } catch (confirmErr: unknown) {
            toast.error(
              confirmErr instanceof Error
                ? confirmErr.message
                : "Payment verification failed."
            );
            if (onFailure) onFailure(confirmErr);
          } finally {
            setLoading(false);
          }
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
            if (onDismiss) onDismiss();
          },
        },
      };

      if (intent.razorpay_subscription_id) {
        options.subscription_id = intent.razorpay_subscription_id;
      } else if (intent.razorpay_order_id) {
        options.order_id = intent.razorpay_order_id;
        options.amount = intent.amount || amountPaise;
      }

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", function (response: RazorpayFailureResponse) {
        setLoading(false);
        toast.error(`Payment failed: ${response.error.description}`);
        if (onFailure) onFailure(response.error);
      });

      rzp.open();
    } catch (err: unknown) {
      setLoading(false);
      toast.error(err instanceof Error ? err.message : "Failed to initialize payment.");
      if (onFailure) onFailure(err);
    }
  };

  return (
    <button
      type="button"
      onClick={handlePayment}
      disabled={disabled || loading || !scriptLoaded || !process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID}
      className={buttonClassName}
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin text-[var(--accent-green)]" />
          <span>Processing Payment...</span>
        </>
      ) : (
        <>
          <ShieldCheck className="w-4 h-4 text-[var(--accent-green)]" />
          <span>{buttonText}</span>
        </>
      )}
    </button>
  );
}
