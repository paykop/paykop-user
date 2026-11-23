"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  ChevronRight,
  Loader2,
  MapPin,
  Package,
  Sparkles,
  Wrench,
  CheckCircle2,
  ShieldCheck,
  Circle,
  Lock,
  Plus,
  ExternalLink,
} from "lucide-react";
import { api } from "@/lib/api/endpoints";
import { useLocationStore } from "@/lib/location/store";
import {
  AgentOnboardingStatus,
  AgentSellerSummary,
  SellerSubscription,
  SubscriptionPlan,
  Product,
} from "@/types";
import { MediaThumb } from "@/components/ui/MediaThumb";
import { AgentGate } from "@/components/agent/AgentGate";
import { kycStatusChipClass, kycStatusLabel } from "@/lib/kyc";
import { formatPaise } from "@/lib/money";
import { toast } from "@/lib/toast";
import {
  AGENT_WIZARD_STEPS,
  AgentWizardStep,
  cacheSellerPaymentIntent,
  clearCachedSellerPaymentIntent,
  deriveAgentWizardStep,
  getCachedSellerPaymentIntent,
  isAgentOnboardingComplete,
  wizardStepIndex,
} from "@/lib/agent/onboarding";
import { openSellerSubscriptionCheckout } from "@/lib/agent/openSellerSubscriptionCheckout";

function SellerDetailContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const sellerId = params.id as string;
  const { latitude, longitude, cityName, formattedAddress } = useLocationStore();

  const [seller, setSeller] = useState<AgentSellerSummary | null>(null);
  const [onboarding, setOnboarding] = useState<AgentOnboardingStatus | null>(null);
  const [subscription, setSubscription] = useState<SellerSubscription | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [subscribingPlanId, setSubscribingPlanId] = useState<number | null>(null);
  const [awaitingPayment, setAwaitingPayment] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [bio, setBio] = useState("");

  const [bizLat, setBizLat] = useState("");
  const [bizLng, setBizLng] = useState("");
  const [bizAddress, setBizAddress] = useState("");
  const [bizCity, setBizCity] = useState("");
  const [bizState, setBizState] = useState("");
  const [bizPostal, setBizPostal] = useState("");

  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPaymentPoll = useCallback(() => {
    if (pollTimer.current) {
      clearInterval(pollTimer.current);
      pollTimer.current = null;
    }
    setAwaitingPayment(false);
  }, []);

  const loadSeller = useCallback(() => {
    return Promise.all([
      api.agent.getSeller(sellerId),
      api.agent.getOnboardingStatus(sellerId).catch(() => null),
      api.agent.getSellerSubscription(sellerId).catch(() => null),
    ])
      .then(([data, onboardingData, subData]) => {
        setSeller(data);
        setOnboarding(onboardingData);
        setSubscription(subData);
        setFirstName(data.first_name || "");
        setLastName(data.last_name || "");
        setPhone((data.phone || "").replace(/^\+91/, ""));
        setEmail(data.email || "");
        setAddress(data.address || "");
        return { data, onboardingData, subData };
      })
      .catch(() => {
        setSeller(null);
        setOnboarding(null);
        setSubscription(null);
        return null;
      })
      .finally(() => setLoading(false));
  }, [sellerId]);

  const load = useCallback(
    ({ showLoading = false }: { showLoading?: boolean } = {}) => {
      if (showLoading) setLoading(true);
      return loadSeller();
    },
    [loadSeller]
  );

  const loadSellerProducts = useCallback(() => {
    setProductsLoading(true);
    return api.agent
      .getSellerProducts(sellerId)
      .then((data) => setProducts(Array.isArray(data) ? data : []))
      .catch(() => setProducts([]))
      .finally(() => setProductsLoading(false));
  }, [sellerId]);

  useEffect(() => {
    void loadSeller();
  }, [loadSeller]);

  useEffect(() => () => stopPaymentPoll(), [stopPaymentPoll]);

  useEffect(() => {
    const listed = searchParams.get("listed");
    if (!listed) return;
    if (listed === "product") {
      setMsg("Product created. Add another listing or tap Done.");
      void loadSellerProducts();
    } else if (listed === "service") {
      setMsg("Service created. Add another listing or tap Done.");
    } else {
      setMsg("Listing created. Add another or tap Done.");
    }
    router.replace(`/agent/sellers/${sellerId}`, { scroll: false });
  }, [searchParams, sellerId, router, loadSellerProducts]);

  const statusSource = onboarding ?? seller;
  const activeStep: AgentWizardStep | null = statusSource
    ? deriveAgentWizardStep(statusSource)
    : null;

  useEffect(() => {
    if (activeStep === "listings") {
      void loadSellerProducts();
    }
  }, [activeStep, loadSellerProducts]);

  useEffect(() => {
    if (activeStep !== "choose_subscription" && activeStep !== "complete_subscription_payment") {
      return;
    }
    let cancelled = false;
    void Promise.resolve().then(async () => {
      if (cancelled) return;
      setPlansLoading(true);
      try {
        const data = await api.subscriptions.getPlans();
        if (!cancelled) {
          setPlans(Array.isArray(data) ? data.filter((p) => p.is_active !== false) : []);
        }
      } catch {
        if (!cancelled) setPlans([]);
      } finally {
        if (!cancelled) setPlansLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [activeStep]);

  const flash = (text: string) => {
    setMsg(text);
    setTimeout(() => setMsg(""), 3000);
  };

  const sellerPrefill = () => ({
    name: `${seller?.first_name || firstName} ${seller?.last_name || lastName}`.trim(),
    email: seller?.email || email || undefined,
    contact: seller?.phone || (phone ? `+91${phone.replace(/\D/g, "")}` : undefined),
  });

  const startPaymentPoll = useCallback(() => {
    stopPaymentPoll();
    setAwaitingPayment(true);
    let attempts = 0;
    pollTimer.current = setInterval(() => {
      attempts += 1;
      void loadSeller().then((result) => {
        if (!result) return;
        const step = deriveAgentWizardStep(result.onboardingData ?? result.data);
        if (step !== "complete_subscription_payment" && step !== "choose_subscription") {
          clearCachedSellerPaymentIntent(sellerId);
          stopPaymentPoll();
          setMsg("Payment confirmed — continue onboarding");
          setTimeout(() => setMsg(""), 3000);
        }
      });
      if (attempts >= 40) {
        stopPaymentPoll();
        toast.error("Still waiting for payment confirmation. Tap Refresh status.");
      }
    }, 2500);
  }, [loadSeller, sellerId, stopPaymentPoll]);

  const openCachedCheckout = async () => {
    const cached = getCachedSellerPaymentIntent(sellerId);
    if (!cached) {
      setErrorMsg("No pending payment found. Pick a paid plan again to start checkout.");
      return;
    }
    setErrorMsg("");
    try {
      await openSellerSubscriptionCheckout({
        payment: cached,
        prefill: sellerPrefill(),
        description: cached.plan_name
          ? `Subscription: ${cached.plan_name}`
          : "Seller subscription",
        onPaid: () => {
          startPaymentPoll();
          flash("Payment submitted — waiting for confirmation…");
        },
        onDismiss: () => {
          flash("Checkout closed. You can resume UPI / QR payment anytime.");
        },
        onFailure: (err) => {
          const message =
            err && typeof err === "object" && "description" in err
              ? String((err as { description?: string }).description)
              : "Payment failed";
          toast.error(message);
        },
      });
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to open payment checkout");
    }
  };

  const handleCancelPendingSubscription = async () => {
    if (!confirm("Cancel this pending subscription checkout and pick another plan?")) return;
    stopPaymentPoll();
    clearCachedSellerPaymentIntent(sellerId);
    try {
      await api.agent.cancelSellerSubscription(sellerId);
      toast.success("Pending subscription cancelled. Please pick a plan.");
    } catch {
      toast.info("Cleared local pending intent. Please pick a plan.");
    }
    await load({ showLoading: false });
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg("");
    try {
      const updated = await api.agent.updateSellerProfile(sellerId, {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone: phone.replace(/\D/g, "").length === 10 ? `+91${phone.replace(/\D/g, "")}` : phone,
        email: email.trim() || undefined,
        address: address.trim(),
        bio: bio.trim() || undefined,
      });
      setSeller(updated);
      flash("Profile saved — next: pick a plan");
      await load({ showLoading: false });
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleSubscribe = async (plan: SubscriptionPlan) => {
    setSubscribingPlanId(plan.id);
    setErrorMsg("");
    try {
      const res = await api.agent.subscribeSeller(sellerId, plan.id);
      if (res.mode === "payment_intent") {
        if (!res.payment) {
          setErrorMsg("Payment intent missing from server. Try again.");
          return;
        }
        cacheSellerPaymentIntent(sellerId, res.payment, {
          plan_id: plan.id,
          plan_name: plan.name,
        });
        flash("Hand the phone to the seller to pay with UPI / QR.");
        await openSellerSubscriptionCheckout({
          payment: {
            plan_id: plan.id,
            plan_name: plan.name,
            amount: res.payment.amount,
            currency: res.payment.currency || "INR",
            provider_ref: res.payment.provider_ref,
            razorpay_order_id: res.payment.razorpay_order_id,
            razorpay_subscription_id: res.payment.razorpay_subscription_id,
          },
          prefill: sellerPrefill(),
          description: `Subscription: ${plan.name}`,
          onPaid: () => {
            startPaymentPoll();
            flash("Payment submitted — waiting for confirmation…");
          },
          onDismiss: () => {
            void load({ showLoading: false });
          },
          onFailure: (err) => {
            const message =
              err && typeof err === "object" && "description" in err
                ? String((err as { description?: string }).description)
                : "Payment failed";
            toast.error(message);
            void load({ showLoading: false });
          },
        });
        await load({ showLoading: false });
        return;
      }
      clearCachedSellerPaymentIntent(sellerId);
      const sub = res.subscription;
      flash(
        sub
          ? `Subscribed to ${sub.plan}${sub.expires_at ? ` until ${new Date(sub.expires_at).toLocaleDateString()}` : ""}`
          : "Subscription activated"
      );
      await load({ showLoading: false });
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to subscribe seller");
    } finally {
      setSubscribingPlanId(null);
    }
  };

  const handleBusinessLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bizAddress.trim()) {
      setErrorMsg("Business address is required.");
      return;
    }
    const lat = bizLat.trim() ? Number(bizLat) : undefined;
    const lng = bizLng.trim() ? Number(bizLng) : undefined;
    if (bizLat.trim() && Number.isNaN(lat)) {
      setErrorMsg("Latitude must be a number.");
      return;
    }
    if (bizLng.trim() && Number.isNaN(lng)) {
      setErrorMsg("Longitude must be a number.");
      return;
    }
    setSaving(true);
    setErrorMsg("");
    try {
      await api.agent.updateSellerBusinessLocation(sellerId, {
        address: bizAddress.trim(),
        latitude: lat,
        longitude: lng,
        city: bizCity.trim() || undefined,
        state: bizState.trim() || undefined,
        postal_code: bizPostal.trim() || undefined,
        location_enabled: true,
      });
      if (latitude != null && longitude != null) {
        try {
          await api.agent.updateSellerLocation(sellerId, {
            latitude,
            longitude,
            city: cityName,
            address: formattedAddress,
            formatted_address: formattedAddress,
          });
        } catch {
          // current location is optional relative to business location
        }
      }
      flash("Business location saved — you can add products or services");
      await load({ showLoading: false });
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to save business location");
    } finally {
      setSaving(false);
    }
  };

  const fillBizFromStore = () => {
    if (latitude != null) setBizLat(String(latitude));
    if (longitude != null) setBizLng(String(longitude));
    if (formattedAddress) setBizAddress(formattedAddress);
    if (cityName) setBizCity(cityName);
  };

  if (loading) {
    return (
      <div className="py-20 text-center">
        <Loader2 className="w-8 h-8 text-[var(--primary)] animate-spin mx-auto" />
      </div>
    );
  }

  if (!seller || !activeStep) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center space-y-3">
        <h2 className="text-xl font-black text-gray-900">Seller not found</h2>
        <Link href="/agent/sellers" className="text-sm font-bold text-[var(--primary)]">
          Back to sellers
        </Link>
      </div>
    );
  }

  const currentIndex = wizardStepIndex(activeStep);
  const onboardingComplete = isAgentOnboardingComplete(activeStep);
  const cachedPay = getCachedSellerPaymentIntent(sellerId);
  const missing = (onboarding ?? seller).seller_ready_missing;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <nav className="flex items-center gap-2 text-xs text-gray-500 flex-wrap">
        <Link href="/" className="hover:text-gray-900">
          Home
        </Link>
        <ChevronRight className="w-3.5 h-3.5 shrink-0" />
        <Link href="/agent" className="hover:text-gray-900">
          Agent Hub
        </Link>
        <ChevronRight className="w-3.5 h-3.5 shrink-0" />
        <Link href="/agent/sellers" className="hover:text-gray-900">
          Sellers
        </Link>
        <ChevronRight className="w-3.5 h-3.5 shrink-0" />
        <span className="font-semibold text-gray-900 truncate">
          {seller.first_name} {seller.last_name}
        </span>
      </nav>

      <div className="min-w-0 space-y-2">
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
          {seller.first_name} {seller.last_name}
        </h1>
        <p className="text-sm text-gray-500 break-all">{seller.phone || seller.email}</p>
        <div className="flex flex-wrap gap-2">
          <span
            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${kycStatusChipClass(
              seller.kyc_status
            )}`}
          >
            KYC: {kycStatusLabel(seller.kyc_status)}
          </span>
          {seller.has_subscription && (
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700">
              Subscribed
            </span>
          )}
          {(onboarding ?? seller).commercial_access_status && (
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-700">
              Access: {(onboarding ?? seller).commercial_access_status}
            </span>
          )}
        </div>
        <p className="text-[11px] text-gray-500 max-w-xl">
          Finish each onboarding step in order. Paid plans: seller pays on this device via UPI /
          QR. Agent KYC is approved instantly after submit.
        </p>
        {missing && missing.length > 0 && (
          <p className="text-[11px] text-amber-700">Still needed: {missing.join(", ")}</p>
        )}
      </div>

      <div className="shopcart-card p-4 sm:p-5 bg-white">
        <ol className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {AGENT_WIZARD_STEPS.map((step, idx) => {
            const done = onboardingComplete || idx < currentIndex;
            const current = !onboardingComplete && idx === currentIndex;
            return (
              <li key={step.id} className="flex items-center gap-2 text-sm min-w-0">
                {done ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : current ? (
                  <Circle className="w-4 h-4 text-[var(--primary)] shrink-0 fill-[var(--primary)]/20" />
                ) : (
                  <Lock className="w-3.5 h-3.5 text-gray-300 shrink-0" />
                )}
                <span
                  className={
                    done
                      ? "text-gray-900 font-semibold truncate"
                      : current
                        ? "text-[var(--primary)] font-bold truncate"
                        : "text-gray-400 truncate"
                  }
                >
                  {idx + 1}. {step.label}
                </span>
              </li>
            );
          })}
        </ol>
      </div>

      {msg && (
        <div className="text-xs text-emerald-700 bg-emerald-50 p-3 rounded-xl border border-emerald-100 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" /> {msg}
        </div>
      )}
      {errorMsg && (
        <div className="text-xs text-red-600 bg-red-50 p-3 rounded-xl border border-red-100">{errorMsg}</div>
      )}
      {awaitingPayment && (
        <div className="text-xs text-blue-800 bg-blue-50 p-3 rounded-xl border border-blue-100 flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
          Waiting for payment confirmation…
        </div>
      )}

      {activeStep === "complete_profile" && (
        <div className="shopcart-card p-5 sm:p-6 bg-white space-y-4">
          <h2 className="font-bold text-gray-900">1. Complete seller profile</h2>
          <p className="text-xs text-gray-500">
            Address is required before you can subscribe this seller to a plan.
          </p>
          <form onSubmit={handleSaveProfile} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">First name</label>
              <input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Last name</label>
              <input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Phone</label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-600 mb-1">Address</label>
              <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm"
                required
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-600 mb-1">Bio</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={2}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm"
              />
            </div>
            <div>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 rounded-full shopcart-btn-primary text-xs font-bold disabled:opacity-50 cursor-pointer"
              >
                {saving ? "Saving…" : "Save & continue"}
              </button>
            </div>
          </form>
        </div>
      )}

      {activeStep === "choose_subscription" && (
        <div className="shopcart-card p-5 sm:p-6 bg-white space-y-4">
          <h2 className="font-bold text-gray-900 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[var(--accent-green)]" /> 2. Pick a plan
          </h2>
          <p className="text-xs text-gray-500">
            Activate a free Commission plan instantly, or open UPI / QR checkout so the seller can
            pay a paid plan on this device.
          </p>
          {subscription && (
            <p className="text-xs text-gray-600">
              Current:{" "}
              <span className="font-bold text-gray-900">
                {typeof subscription.plan === "string" ? subscription.plan : subscription.plan?.name}
              </span>
              {subscription.status ? ` (${subscription.status})` : ""}
            </p>
          )}
          {plansLoading ? (
            <div className="py-10 text-center">
              <Loader2 className="w-6 h-6 text-[var(--primary)] animate-spin mx-auto" />
            </div>
          ) : plans.length === 0 ? (
            <p className="text-xs text-amber-700 bg-amber-50 p-3 rounded-xl">
              No subscription plans available from the server.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {plans.map((plan) => {
                const busy = subscribingPlanId === plan.id;
                return (
                  <div
                    key={plan.id}
                    className="rounded-2xl border border-gray-200 p-4 space-y-2 flex flex-col"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-gray-900">{plan.name}</h3>
                      <span className="text-sm font-black text-[var(--primary)] shrink-0">
                        {plan.price === 0 ? "Free" : formatPaise(plan.price)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 flex-1">{plan.description}</p>
                    <p className="text-[10px] text-gray-400">{plan.duration_days} days</p>
                    <button
                      type="button"
                      disabled={subscribingPlanId != null}
                      onClick={() => void handleSubscribe(plan)}
                      className="mt-2 w-full px-4 py-2.5 rounded-full shopcart-btn-primary text-xs font-bold disabled:opacity-50 cursor-pointer"
                    >
                      {busy
                        ? "Subscribing…"
                        : plan.price === 0
                          ? "Activate plan"
                          : "Pay with UPI / QR"}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeStep === "complete_subscription_payment" && (
        <div className="shopcart-card p-5 sm:p-6 bg-white space-y-4">
          <h2 className="font-bold text-gray-900 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[var(--accent-green)]" /> 2. Complete payment
          </h2>
          <p className="text-xs text-gray-500">
            A paid plan checkout is pending
            {cachedPay?.plan_name ? ` for ${cachedPay.plan_name}` : ""}
            {subscription?.plan
              ? ` (${typeof subscription.plan === "string" ? subscription.plan : subscription.plan?.name})`
              : ""}
            . Hand the phone to the seller to finish with UPI ID or QR.
          </p>
          {cachedPay && (
            <p className="text-sm font-bold text-gray-900">
              Amount: {formatPaise(cachedPay.amount)}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void openCachedCheckout()}
              disabled={!cachedPay || awaitingPayment}
              className="px-5 py-2.5 rounded-full shopcart-btn-primary text-xs font-bold disabled:opacity-50 cursor-pointer"
            >
              Resume UPI / QR payment
            </button>
            <button
              type="button"
              onClick={() => {
                void load({ showLoading: false }).then(() => flash("Status refreshed"));
              }}
              className="px-5 py-2.5 rounded-full bg-white border border-gray-200 text-xs font-bold cursor-pointer hover:bg-gray-50"
            >
              Refresh status
            </button>
            <button
              type="button"
              onClick={() => void handleCancelPendingSubscription()}
              className="px-5 py-2.5 rounded-full bg-white border border-red-200 text-red-700 hover:bg-red-50 text-xs font-bold cursor-pointer transition-colors"
            >
              Cancel & Pick Another Plan
            </button>
          </div>
          {!cachedPay && (
            <p className="text-xs text-amber-700 bg-amber-50 p-3 rounded-xl">
              Checkout details are not on this device. Ask the seller to pay from their seller app,
              or contact support if the pending checkout is stuck.
            </p>
          )}
        </div>
      )}

      {(activeStep === "complete_kyc" || activeStep === "await_kyc_review") && (
        <div className="shopcart-card p-5 sm:p-6 bg-white space-y-4">
          <h2 className="font-bold text-gray-900 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[var(--primary)]" /> 3. Upload KYC
          </h2>
          {activeStep === "await_kyc_review" ? (
            <p className="text-xs text-amber-700 bg-amber-50 p-3 rounded-xl">
              KYC is pending review. For agent onboarding, re-open KYC and submit — approval is
              instant.
            </p>
          ) : (
            <p className="text-xs text-gray-500">
              Upload documents for this seller. When you submit, KYC is approved instantly because
              an agent completed onboarding.
            </p>
          )}
          <Link
            href={`/agent/sellers/${sellerId}/kyc`}
            className="inline-flex px-5 py-2.5 rounded-full shopcart-btn-primary text-xs font-bold items-center gap-1.5"
          >
            <ShieldCheck className="w-3.5 h-3.5" /> Open KYC form
          </Link>
        </div>
      )}

      {activeStep === "set_business_location" && (
        <div className="shopcart-card p-5 sm:p-6 bg-white space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-bold text-gray-900 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[var(--primary)]" /> 4. Business location
            </h2>
            <button
              type="button"
              onClick={fillBizFromStore}
              className="text-xs font-bold text-[var(--primary)] cursor-pointer"
            >
              Fill from my location
            </button>
          </div>
          <p className="text-xs text-gray-500">
            Enter the business address (required). Latitude and longitude are optional — the server
            can geocode the address.
          </p>
          {cityName && <p className="text-[11px] text-gray-400">Header location: {cityName}</p>}
          <form onSubmit={handleBusinessLocation} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-600 mb-1">Address</label>
              <input
                value={bizAddress}
                onChange={(e) => setBizAddress(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Latitude (optional)
              </label>
              <input
                value={bizLat}
                onChange={(e) => setBizLat(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Longitude (optional)
              </label>
              <input
                value={bizLng}
                onChange={(e) => setBizLng(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">City</label>
              <input
                value={bizCity}
                onChange={(e) => setBizCity(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">State</label>
              <input
                value={bizState}
                onChange={(e) => setBizState(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Postal code</label>
              <input
                value={bizPostal}
                onChange={(e) => setBizPostal(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm"
              />
            </div>
            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 rounded-full shopcart-btn-primary text-xs font-bold disabled:opacity-50 cursor-pointer"
              >
                {saving ? "Saving…" : "Save location & continue"}
              </button>
            </div>
          </form>
        </div>
      )}

      {activeStep === "listings" && (
        <div className="space-y-6">
          <div className="shopcart-card p-5 sm:p-6 bg-white space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  Seller Onboarding Complete
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Profile, subscription, KYC, and store location are verified. Upload products or services for this seller.
                </p>
              </div>

              <div className="flex flex-wrap gap-2 shrink-0">
                <Link
                  href={`/agent/sellers/${sellerId}/products`}
                  className="px-4 py-2 rounded-full shopcart-btn-primary text-xs font-bold flex items-center gap-1.5 shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5 text-[var(--accent-green)]" />
                  <span>Add Product</span>
                </Link>
                <Link
                  href={`/agent/sellers/${sellerId}/services`}
                  className="px-4 py-2 rounded-full bg-white border border-gray-200 hover:bg-gray-50 text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <Wrench className="w-3.5 h-3.5 text-gray-600" />
                  <span>Add Service</span>
                </Link>
                <Link
                  href="/agent/sellers"
                  className="px-4 py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Done</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Uploaded Products Catalogue */}
          <div className="shopcart-card p-5 sm:p-6 bg-white space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h3 className="font-bold text-sm sm:text-base text-gray-900 flex items-center gap-2">
                  <Package className="w-4 h-4 text-[var(--primary)]" />
                  Uploaded Products ({products.length})
                </h3>
                <p className="text-xs text-gray-400">Hyperlocal listings live on the Paykop marketplace</p>
              </div>

              <Link
                href={`/agent/sellers/${sellerId}/products`}
                className="text-xs font-bold text-[var(--primary)] hover:underline flex items-center gap-1"
              >
                <span>Catalogue Manager</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {productsLoading ? (
              <div className="py-12 text-center">
                <Loader2 className="w-6 h-6 text-[var(--primary)] animate-spin mx-auto" />
                <p className="text-xs text-gray-400 mt-2">Checking seller listings…</p>
              </div>
            ) : products.length === 0 ? (
              <div className="py-10 text-center space-y-3 bg-gray-50 rounded-2xl border border-dashed border-gray-200 p-6">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[var(--primary)] flex items-center justify-center mx-auto">
                  <Package className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-gray-900">No products uploaded yet</h4>
                  <p className="text-xs text-gray-500 max-w-sm mx-auto mt-0.5">
                    This seller is ready for their first product listing. Upload products with images, price, and stock to make them visible to buyers.
                  </p>
                </div>
                <Link
                  href={`/agent/sellers/${sellerId}/products`}
                  className="inline-flex px-5 py-2.5 rounded-full shopcart-btn-primary text-xs font-bold items-center gap-1.5 shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5 text-[var(--accent-green)]" />
                  <span>Upload First Product</span>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {products.map((prod) => {
                    const img = prod.images && prod.images.length > 0 ? prod.images[0] : null;

                    return (
                      <div
                        key={prod.id}
                        className="p-3 bg-gray-50/70 rounded-2xl border border-gray-200 flex gap-3 items-center hover:bg-white hover:shadow-sm transition-all"
                      >
                        <div className="w-16 h-16 rounded-xl overflow-hidden bg-white shrink-0 border border-gray-100">
                          <MediaThumb src={img} alt={prod.title} className="object-cover w-full h-full" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-bold text-xs text-gray-900 truncate">{prod.title}</h4>
                          <div className="text-xs font-black text-[var(--primary)] mt-0.5">
                            {formatPaise(prod.price)}
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-400">
                            <span className="text-emerald-700 font-semibold">Stock: {prod.stock}</span>
                            <span>·</span>
                            <Link
                              href={`/products/${prod.id}`}
                              target="_blank"
                              className="text-[var(--primary)] hover:underline flex items-center gap-0.5 font-medium"
                            >
                              <span>View</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </Link>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <span className="text-xs text-gray-400">
                    {products.length} {products.length === 1 ? "product" : "products"} active in catalogue
                  </span>
                  <Link
                    href={`/agent/sellers/${sellerId}/products`}
                    className="text-xs font-bold text-[var(--primary)] hover:underline flex items-center gap-1"
                  >
                    <span>+ Add Another Product</span>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AgentSellerDetailPage() {
  return (
    <AgentGate>
      <SellerDetailContent />
    </AgentGate>
  );
}
