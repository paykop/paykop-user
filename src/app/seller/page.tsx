"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Store,
  CheckCircle2,
  Sparkles,
  ChevronRight,
  Loader2,
  Package,
  TrendingUp,
} from "lucide-react";
import { api } from "@/lib/api/endpoints";
import { session } from "@/lib/auth/session";
import { SellerSubscription, SubscriptionHistoryItem, SubscriptionPlan, User } from "@/types";
import { formatPaise } from "@/lib/money";
import { openSubscriptionCheckout } from "@/lib/agent/openSellerSubscriptionCheckout";
import { EmptyState } from "@/components/ui/EmptyState";
import { kycStatusChipClass, kycStatusLabel, isKycVerified } from "@/lib/kyc";
import { toast } from "@/lib/toast";
import { useTour } from "@/lib/tours/useTour";
import { SellerOnboardingPanel } from "@/components/seller/SellerOnboardingPanel";
import { SellerReadiness } from "@/types";

export default function SellerPage() {
  useTour("seller_hub", { autoStart: true, delayMs: 800 });
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscribingPlanId, setSubscribingPlanId] = useState<number | null>(null);
  const [subscriptionSuccess, setSubscriptionSuccess] = useState(false);
  const [activeSub, setActiveSub] = useState<SellerSubscription | null>(null);
  const [subHistory, setSubHistory] = useState<SubscriptionHistoryItem[]>([]);
  const [cancelling, setCancelling] = useState(false);
  const [readiness, setReadiness] = useState<SellerReadiness | null>(null);

  const loadSubscriptionData = () =>
    Promise.all([
      api.subscriptions.getMySubscription().catch(() => null),
      api.subscriptions.getHistory().catch(() => []),
    ]).then(([sub, history]) => {
      setActiveSub(sub);
      setSubHistory(Array.isArray(history) ? history : []);
    });

  const refreshSellerState = async () => {
    const [me, readinessData] = await Promise.all([
      api.auth.getMe().catch(() => null),
      api.sellers.getReadiness().catch(() => null),
    ]);
    if (me) {
      setUser(me);
      session.setUser(me);
    }
    if (readinessData) setReadiness(readinessData);
    await loadSubscriptionData();
  };

  useEffect(() => {
    if (!session.isAuthenticated()) return;

    Promise.all([
      api.auth.getMe().catch((err) => {
        console.error("Failed to load seller profile", err);
        toast.error("Failed to load seller profile");
        return session.getUser();
      }),
      api.subscriptions.getPlans().catch((err) => {
        console.error("Failed to load subscription plans", err);
        toast.error("Failed to load subscription plans");
        return [];
      }),
      loadSubscriptionData(),
      api.sellers.getReadiness().catch(() => null),
    ])
      .then(([me, planData, , readinessData]) => {
        if (me) {
          setUser(me);
          session.setUser(me);
        }
        setPlans(Array.isArray(planData) ? planData : []);
        if (readinessData) setReadiness(readinessData);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleCancelSubscription = async () => {
    if (!confirm("Cancel your active seller subscription?")) return;
    setCancelling(true);
    try {
      await api.subscriptions.cancel();
      toast.success("Subscription cancelled");
      await refreshSellerState();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to cancel subscription");
    } finally {
      setCancelling(false);
    }
  };

  const handleSubscribe = async (plan: SubscriptionPlan) => {
    if (!session.isAuthenticated()) {
      window.dispatchEvent(new CustomEvent("paykop_open_login"));
      return;
    }

    if (user && !user.is_onboarded) {
      toast.error("Please complete your profile verification before subscribing.");
      router.push("/onboarding");
      return;
    }

    setSubscribingPlanId(plan.id);
    try {
      const res = await api.subscriptions.subscribe({ plan_id: plan.id });
      if (res.mode === "activated") {
        toast.success(`Subscribed to ${plan.name} successfully!`);
        setSubscriptionSuccess(true);
        await refreshSellerState();
        return;
      }

      if (res.mode === "payment_intent") {
        if (!res.payment) {
          toast.error("Payment details missing from server. Please try again.");
          return;
        }

        await openSubscriptionCheckout({
          payment: {
            plan_id: plan.id,
            plan_name: plan.name,
            amount: res.payment.amount,
            currency: res.payment.currency || "INR",
            provider_ref: res.payment.provider_ref,
            razorpay_order_id: res.payment.razorpay_order_id,
            razorpay_subscription_id: res.payment.razorpay_subscription_id,
          },
          prefill: {
            name: user ? `${user.first_name} ${user.last_name}`.trim() : "",
            email: user?.email || "",
            contact: user?.phone || "",
          },
          description: `Subscription: ${plan.name}`,
          onPaid: () => {
            toast.info("Payment submitted! Confirming subscription...");
            let attempts = 0;
            const timer = setInterval(async () => {
              attempts += 1;
              try {
                const sub = await api.subscriptions.getMySubscription().catch(() => null);
                if (sub && sub.status === "active") {
                  clearInterval(timer);
                  toast.success(`Subscription to ${plan.name} is now active!`);
                  setSubscriptionSuccess(true);
                  await refreshSellerState();
                  return;
                }
              } catch {
                // Ignore transient error
              }

              if (attempts >= 8) {
                clearInterval(timer);
                toast.info("Payment received. Refreshing subscription status...");
                void refreshSellerState();
              }
            }, 2000);
          },
          onDismiss: () => {
            toast.info("Subscription checkout closed.");
            void loadSubscriptionData();
          },
          onFailure: (err) => {
            const message =
              err && typeof err === "object" && "description" in err
                ? String((err as { description?: string }).description)
                : "Payment failed";
            toast.error(message);
            void loadSubscriptionData();
          },
        });
        return;
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to subscribe to plan";
      if (msg.includes("pending subscription checkout")) {
        toast.error("You have a pending subscription checkout. Please wait a moment or refresh.");
      } else if (msg.includes("already has an active subscription")) {
        toast.error("You already have an active subscription. Cancel it first to switch plans.");
      } else {
        toast.error(msg);
      }
      void loadSubscriptionData();
    } finally {
      setSubscribingPlanId(null);
    }
  };

  if (!session.isAuthenticated()) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-[var(--primary)] flex items-center justify-center mx-auto">
          <Store className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-gray-900 tracking-tight">Sell on Paykop</h2>
        <p className="text-xs sm:text-sm text-gray-500 max-w-sm mx-auto">
          Sign in to access seller tools, choose a subscription tier, and list products for neighborhood buyers.
        </p>
        <button
          onClick={() => window.dispatchEvent(new CustomEvent("paykop_open_login"))}
          className="px-6 py-3 rounded-full shopcart-btn-primary font-bold text-xs shadow-md cursor-pointer"
        >
          Sign In to Get Started
        </button>
      </div>
    );
  }

  const isSeller = user?.role === "seller" || user?.has_subscription;
  const kycVerified = isKycVerified(user?.kyc_status);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Breadcrumb */}
      {user && (
        <SellerOnboardingPanel
          subject={{
            next_onboarding_step: readiness?.next_onboarding_step ?? user.next_onboarding_step,
            is_onboarded: user.is_onboarded,
            has_subscription: user.has_subscription,
            kyc_status: readiness?.kyc_status ?? user.kyc_status,
            is_seller_ready: readiness?.is_seller_ready ?? user.is_seller_ready,
          }}
        />
      )}

      <nav className="flex items-center gap-2 text-xs text-gray-500 flex-wrap">
        <Link href="/" className="hover:text-gray-900">
          Home
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="font-semibold text-gray-900">Seller Hub</span>
      </nav>

      {/* Hero Banner */}
      <div className="rounded-3xl bg-[var(--primary)] text-white p-6 sm:p-10 relative overflow-hidden shadow-lg">
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--accent-green)]/20 text-[var(--accent-green)] text-xs font-bold">
              <Store className="w-3.5 h-3.5" />
              <span>Hyperlocal Seller & Provider Hub</span>
            </div>
            {isSeller && (
              <span
                data-tour="seller-kyc-badge"
                className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${kycStatusChipClass(
                  user?.kyc_status
                )}`}
              >
                KYC: {kycStatusLabel(user?.kyc_status)}
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight">
            Grow Your Local Business on Paykop
          </h1>
          <p className="text-sm text-white/80">
            Reach thousands of buyers in your city, manage product listings, and accept instant 256-bit secure payments.
          </p>

          {isSeller && !kycVerified && (
            <p className="text-xs text-amber-100 bg-white/10 border border-white/15 rounded-xl px-3 py-2">
              Complete KYC verification before publishing new product listings.{" "}
              <Link href="/seller/kyc" className="font-bold underline text-white">
                Complete KYC
              </Link>
            </p>
          )}

          {isSeller && (
            <div data-tour="seller-quick-actions" className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                href="/seller/products"
                className="px-6 py-3 rounded-full bg-[var(--accent-green)] text-[var(--primary-dark)] font-bold text-xs flex items-center gap-2 shadow-md"
              >
                <Package className="w-4 h-4" />
                <span>Manage Products</span>
              </Link>
              <Link
                href="/seller/services"
                className="px-6 py-3 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20"
              >
                Manage Services
              </Link>
              <Link
                href="/seller/bookings"
                className="px-6 py-3 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20"
              >
                Provider Bookings
              </Link>
              <Link
                href="/seller/orders"
                className="px-6 py-3 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20"
              >
                Orders
              </Link>
              <Link
                href="/seller/returns"
                className="px-6 py-3 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20"
              >
                Customer Returns
              </Link>
              {!kycVerified && (
                <Link
                  href="/seller/kyc"
                  className="px-6 py-3 rounded-full bg-amber-400 text-amber-950 font-bold text-xs"
                >
                  Complete KYC
                </Link>
              )}
            </div>
          )}
        </div>
      </div>

      {subscriptionSuccess && (
        <div className="p-6 rounded-3xl bg-emerald-50 border border-emerald-200 text-center space-y-2">
          <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
          <h3 className="font-bold text-base text-emerald-900">Subscription Activated!</h3>
          <p className="text-xs text-emerald-700">
            Your seller membership has been confirmed. You can now list unlimited hyperlocal products and services.
          </p>
          <Link
            href="/seller/products"
            className="inline-block px-5 py-2.5 rounded-full shopcart-btn-primary text-xs font-bold mt-2"
          >
            Go to Product Listings
          </Link>
        </div>
      )}

      {/* Seller Management Quick Links if active */}
      {isSeller && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            href="/seller/products"
            className="shopcart-card p-6 bg-white flex items-center justify-between hover:border-[var(--primary)] transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[var(--primary)] flex items-center justify-center font-bold">
                <Package className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-gray-900 group-hover:text-[var(--primary)]">
                  Product Catalogue Management
                </h3>
                <p className="text-xs text-gray-500">Create, edit, and restock inventory</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-[var(--primary)]" />
          </Link>

          <Link
            href="/seller/bookings"
            className="shopcart-card p-6 bg-white flex items-center justify-between hover:border-[var(--primary)] transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[var(--primary-subtle)] text-[var(--primary)] flex items-center justify-center font-bold">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-gray-900 group-hover:text-[var(--primary)]">
                  Service Bookings Orders
                </h3>
                <p className="text-xs text-gray-500">Accept appointments and complete visits</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-[var(--primary)]" />
          </Link>
        </div>
      )}

      {/* Active subscription */}
      {activeSub && (
        <div className="shopcart-card p-6 bg-white space-y-4">
          <h2 className="text-lg font-black text-gray-900">Your subscription</h2>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="font-bold text-gray-900">
                {typeof activeSub.plan === "string" ? activeSub.plan : activeSub.plan?.name}
              </p>
              <p className="text-xs text-gray-500">
                Active since {new Date(activeSub.starts_at).toLocaleDateString()}
                {activeSub.expires_at &&
                  ` · Expires ${new Date(activeSub.expires_at).toLocaleDateString()}`}
              </p>
            </div>
            <button
              type="button"
              onClick={handleCancelSubscription}
              disabled={cancelling}
              className="px-4 py-2 rounded-full border border-red-200 text-red-700 text-xs font-bold disabled:opacity-50 cursor-pointer"
            >
              {cancelling ? "Cancelling…" : "Cancel subscription"}
            </button>
          </div>
          {subHistory.length > 0 && (
            <div className="pt-4 border-t border-gray-100 space-y-2">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">History</h3>
              <ul className="space-y-1.5">
                {subHistory.map((item) => (
                  <li key={item.id} className="text-xs text-gray-600 flex justify-between gap-2">
                    <span>
                      {item.plan} · {item.status}
                    </span>
                    <span className="text-gray-400 shrink-0">
                      {new Date(item.starts_at).toLocaleDateString()}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Subscription Plans Section */}
      <div data-tour="seller-plans" className="space-y-6">
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">
            Seller Membership Plans
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Transparent flat pricing. No hidden percentages on merchant orders.
          </p>
        </div>

        {loading ? (
          <div className="py-20 text-center">
            <Loader2 className="w-8 h-8 text-[var(--primary)] animate-spin mx-auto" />
            <p className="text-xs text-gray-500 mt-2">Loading plans...</p>
          </div>
        ) : plans.length === 0 ? (
          <EmptyState
            icon={<Sparkles className="w-8 h-8" />}
            title="No subscription plans available"
            description="Plans could not be loaded from the server. Please try again later."
            action={
              <button
                type="button"
                onClick={() => {
                  setLoading(true);
                  api.subscriptions
                    .getPlans()
                    .then((data) => setPlans(Array.isArray(data) ? data : []))
                    .catch(() => setPlans([]))
                    .finally(() => setLoading(false));
                }}
                className="inline-flex px-5 py-2.5 rounded-full shopcart-btn-primary font-bold text-xs"
              >
                Retry
              </button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => {
              const isCurrentPlan =
                activeSub?.status === "active" &&
                (typeof activeSub.plan === "string"
                  ? activeSub.plan === plan.name || activeSub.plan === String(plan.id)
                  : activeSub.plan?.id === plan.id || activeSub.plan?.name === plan.name);
              const hasActiveSub = activeSub?.status === "active";
              const isSubscribing = subscribingPlanId === plan.id;

              return (
                <div
                  key={plan.id}
                  className={`shopcart-card p-6 bg-white flex flex-col justify-between space-y-6 border ${
                    isCurrentPlan
                      ? "border-[var(--primary)] ring-2 ring-[var(--primary)]/20 shadow-md"
                      : "border-gray-200"
                  }`}
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-black text-lg text-gray-900">{plan.name}</h3>
                        <p className="text-xs text-gray-500 mt-1">{plan.description}</p>
                      </div>
                      {isCurrentPlan && (
                        <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider shrink-0">
                          Active
                        </span>
                      )}
                    </div>

                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-[var(--primary)]">
                        {formatPaise(plan.price)}
                      </span>
                      <span className="text-xs text-gray-400">/{plan.duration_days} days</span>
                    </div>

                    {(plan.features ?? []).length > 0 && (
                      <ul className="space-y-2 pt-2 border-t border-gray-100 text-xs text-gray-600">
                        {(plan.features ?? []).map((feat, fidx) => (
                          <li key={fidx} className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {isCurrentPlan ? (
                    <button
                      type="button"
                      disabled
                      className="w-full py-3 px-4 rounded-xl bg-gray-100 text-gray-500 font-bold text-xs flex items-center justify-center gap-1.5 cursor-not-allowed border border-gray-200"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Current Active Plan
                    </button>
                  ) : hasActiveSub ? (
                    <button
                      type="button"
                      onClick={() => {
                        toast.info("Please cancel your active subscription above before subscribing to a new plan.");
                      }}
                      className="w-full py-3 px-4 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer border border-gray-200 transition-colors"
                    >
                      Switch to {plan.name}
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={isSubscribing}
                      onClick={() => handleSubscribe(plan)}
                      className="w-full py-3 px-4 rounded-xl shopcart-btn-primary font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-60"
                    >
                      {isSubscribing ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Processing…</span>
                        </>
                      ) : plan.price === 0 ? (
                        "Activate Free Plan"
                      ) : (
                        `Subscribe to ${plan.name}`
                      )}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
