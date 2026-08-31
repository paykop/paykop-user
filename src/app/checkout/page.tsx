"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { MediaThumb } from "@/components/ui/MediaThumb";
import Link from "next/link";
import {
  ShieldCheck,
  MapPin,
  Loader2,
  ChevronRight,
  Plus,
  CreditCard,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import { api } from "@/lib/api/endpoints";
import { session } from "@/lib/auth/session";
import { Product, Address, Order } from "@/types";
import { formatPaise } from "@/lib/money";
import { RazorpayCheckout } from "@/components/checkout/RazorpayCheckout";

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const productId = searchParams.get("product_id");
  const quantity = Number(searchParams.get("quantity") || "1");

  const [product, setProduct] = useState<Product | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<"online" | "cash">("online");
  const [loading, setLoading] = useState(true);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Created Order state for online payment
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (!session.isAuthenticated()) {
      const next = `/checkout?product_id=${productId || ""}&quantity=${quantity}`;
      router.push(`/login?redirect=${encodeURIComponent(next)}`);
      return;
    }

    const user = session.getUser();
    if (user && !user.is_onboarded) {
      router.push("/onboarding");
      return;
    }

    if (!productId) {
      router.push("/cart");
      return;
    }

    Promise.all([
      api.products.getById(productId).catch(() => null),
      api.addresses.list().catch(() => []),
    ])
      .then(([prodData, addrData]) => {
        if (prodData) setProduct(prodData);
        if (Array.isArray(addrData) && addrData.length > 0) {
          setAddresses(addrData);
          const defaultAddr = addrData.find((a) => a.is_default) || addrData[0];
          setSelectedAddressId(defaultAddr.id);
        }
      })
      .finally(() => setLoading(false));
  }, [productId, quantity, router]);

  const subtotalPaise = (product?.price || 0) * quantity;
  const deliveryFeePaise = 0; // Hyperlocal free promo
  const totalPaise = subtotalPaise + deliveryFeePaise;

  const handlePlaceCODOrder = async () => {
    if (!selectedAddressId) {
      setErrorMsg("Please select or add a delivery address.");
      return;
    }

    setIsPlacingOrder(true);
    setErrorMsg("");

    try {
      const order = await api.orders.create({
        product_id: Number(productId),
        quantity,
        payment_method: "cash",
        address_id: selectedAddressId,
      });

      router.push(`/account/orders/${order.id}?success=true`);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to place order. Please try again.");
      setIsPlacingOrder(false);
    }
  };

  const handleCreateOrderForOnline = async () => {
    if (!selectedAddressId) {
      setErrorMsg("Please select or add a delivery address.");
      return;
    }

    setIsPlacingOrder(true);
    setErrorMsg("");
    try {
      const order = await api.orders.create({
        product_id: Number(productId),
        quantity,
        payment_method: "online",
        address_id: selectedAddressId,
      });
      setCreatedOrder(order);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to create order for payment.");
    } finally {
      setIsPlacingOrder(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 text-[var(--primary)] animate-spin" />
        <p className="text-xs text-gray-500 mt-3">Preparing checkout...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-xl font-bold text-gray-900">Product details could not be loaded</h2>
        <Link href="/" className="inline-flex px-6 py-3 rounded-full shopcart-btn-primary text-xs font-bold">
          Back to Marketplace
        </Link>
      </div>
    );
  }

  const prodImg =
    product.images && product.images.length > 0
      ? product.images[0]
      : null;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-gray-500 flex-wrap">
        <Link href="/" className="hover:text-gray-900">
          Home
        </Link>
        <ChevronRight className="w-3.5 h-3.5 shrink-0" />
        <Link href={`/products/${productId}`} className="hover:text-gray-900 truncate max-w-[40vw] sm:max-w-none">
          {product.title}
        </Link>
        <ChevronRight className="w-3.5 h-3.5 shrink-0" />
        <span className="font-semibold text-gray-900">Single-Item Checkout</span>
      </nav>

      {/* Header */}
      <div className="pb-4 border-b border-gray-100">
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
          Complete Your Order
        </h1>
        <p className="text-xs text-gray-500 mt-0.5">
          Verified 2-hour delivery directly from the merchant
        </p>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Addresses & Payment Methods */}
        <div className="lg:col-span-7 space-y-6">
          {/* 1. Delivery Address Selection */}
          <div className="shopcart-card p-6 bg-white space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-[var(--primary)]" />
                <h3 className="font-bold text-base text-gray-900">1. Delivery Address</h3>
              </div>
              <Link
                href="/account/addresses"
                className="text-xs font-bold text-[var(--primary)] hover:underline flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add / Manage</span>
              </Link>
            </div>

            {addresses.length === 0 ? (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-800 space-y-2">
                <p className="font-bold">No saved addresses found.</p>
                <Link
                  href="/account/addresses"
                  className="inline-block px-4 py-2 rounded-xl bg-amber-700 text-white font-bold text-xs"
                >
                  Add Delivery Address
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {addresses.map((addr) => (
                  <label
                    key={addr.id}
                    className={`block p-4 rounded-2xl border transition-all cursor-pointer ${
                      selectedAddressId === addr.id
                        ? "border-[var(--primary)] bg-[var(--canvas)] shadow-xs"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <input
                          type="radio"
                          name="delivery_address"
                          checked={selectedAddressId === addr.id}
                          onChange={() => {
                            setSelectedAddressId(addr.id);
                            setCreatedOrder(null);
                          }}
                          className="mt-1 text-[var(--primary)]"
                        />
                        <div className="space-y-1">
                          <span className="font-bold text-xs text-gray-900 block">
                            {addr.label} {addr.is_default && "(Default)"}
                          </span>
                          <p className="text-xs text-gray-600 leading-relaxed">
                            {addr.address_line}
                            {addr.landmark && `, near ${addr.landmark}`}
                            <br />
                            {addr.city}, {addr.state} - {addr.pincode}
                          </p>
                        </div>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* 2. Payment Method */}
          <div className="shopcart-card p-6 bg-white space-y-4">
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-[var(--primary)]" />
              <h3 className="font-bold text-base text-gray-900">2. Payment Method</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Online Razorpay */}
              <label
                className={`p-4 rounded-2xl border flex items-start gap-3 cursor-pointer transition-all ${
                  paymentMethod === "online"
                    ? "border-[var(--primary)] bg-[var(--canvas)] shadow-xs"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <input
                  type="radio"
                  name="payment_method"
                  checked={paymentMethod === "online"}
                  onChange={() => setPaymentMethod("online")}
                  className="mt-1 text-[var(--primary)]"
                />
                <div>
                  <span className="font-bold text-xs text-gray-900 block">
                    Online (UPI / Card / NetBanking)
                  </span>
                  <span className="text-[11px] text-gray-500 block mt-0.5">
                    Fast & verified via Razorpay
                  </span>
                </div>
              </label>

              {/* Cash on Delivery */}
              <label
                className={`p-4 rounded-2xl border flex items-start gap-3 cursor-pointer transition-all ${
                  paymentMethod === "cash"
                    ? "border-[var(--primary)] bg-[var(--canvas)] shadow-xs"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <input
                  type="radio"
                  name="payment_method"
                  checked={paymentMethod === "cash"}
                  onChange={() => setPaymentMethod("cash")}
                  className="mt-1 text-[var(--primary)]"
                />
                <div>
                  <span className="font-bold text-xs text-gray-900 block">
                    Cash on Delivery (COD)
                  </span>
                  <span className="text-[11px] text-gray-500 block mt-0.5">
                    Pay upon physical delivery
                  </span>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Right: Order Summary Card */}
        <div className="lg:col-span-5 shopcart-card p-6 bg-white space-y-6">
          <h3 className="font-black text-base text-gray-900 pb-3 border-b border-gray-100">
            Order Item Summary
          </h3>

          {/* Product Row */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl overflow-hidden relative bg-gray-50 shrink-0 border border-gray-100">
              <MediaThumb src={prodImg} alt={product.title} className="object-cover" />
            </div>
            <div className="space-y-1 flex-1">
              <h4 className="font-bold text-xs text-gray-900 line-clamp-2">{product.title}</h4>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Qty: {quantity}</span>
                <span className="font-bold text-gray-900">{formatPaise(subtotalPaise)}</span>
              </div>
            </div>
          </div>

          {/* Price Breakdown */}
          <div className="space-y-2.5 text-xs pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between text-gray-600">
              <span>Item Subtotal ({quantity}x)</span>
              <span className="font-bold text-gray-900">{formatPaise(subtotalPaise)}</span>
            </div>
            <div className="flex items-center justify-between text-gray-600">
              <span>Hyperlocal 2-Hour Delivery</span>
              <span className="font-bold text-emerald-700">FREE Promo</span>
            </div>
            <div className="flex items-center justify-between text-gray-600">
              <span>Taxes</span>
              <span className="font-bold text-gray-900">Included</span>
            </div>
          </div>

          {/* Total */}
          <div className="pt-4 border-t border-gray-100 flex items-baseline justify-between">
            <span className="font-bold text-sm text-gray-900">Total Payable</span>
            <span className="text-3xl font-black text-[var(--primary)]">{formatPaise(totalPaise)}</span>
          </div>

          {/* Payment Execution CTA */}
          {paymentMethod === "online" ? (
            <div className="space-y-2">
              {createdOrder ? (
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 text-center">
                    Order #{createdOrder.id} created. Complete payment to confirm.
                  </div>
                  <RazorpayCheckout
                    orderId={Number(createdOrder.id)}
                    amountPaise={totalPaise}
                    title={product.title}
                    description={`Order for ${quantity}x ${product.title}`}
                    disabled={!selectedAddressId}
                    onSuccess={(paymentId) => {
                      router.push(
                        `/account/orders/${createdOrder.id}?payment_id=${paymentId}&success=true`
                      );
                    }}
                    buttonText={`Pay ${formatPaise(totalPaise)} via Razorpay`}
                  />
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleCreateOrderForOnline}
                  disabled={isPlacingOrder || !selectedAddressId}
                  className="w-full py-4 px-6 rounded-full shopcart-btn-primary font-bold text-sm flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 cursor-pointer"
                >
                  {isPlacingOrder ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-[var(--accent-green)]" />
                      <span>Creating Order...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4 text-[var(--accent-green)]" />
                      <span>Create Order &amp; Pay {formatPaise(totalPaise)}</span>
                    </>
                  )}
                </button>
              )}
            </div>
          ) : (
            <button
              onClick={handlePlaceCODOrder}
              disabled={isPlacingOrder || !selectedAddressId}
              className="w-full py-4 px-6 rounded-full shopcart-btn-primary font-bold text-sm flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 cursor-pointer"
            >
              {isPlacingOrder ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[var(--accent-green)]" />
                  <span>Placing Order...</span>
                </>
              ) : (
                <>
                  <span>Place COD Order</span>
                  <ArrowRight className="w-4 h-4 text-[var(--accent-green)]" />
                </>
              )}
            </button>
          )}

          {/* Security badge */}
          <div className="pt-4 border-t border-gray-100 text-center text-[11px] text-gray-500 space-y-1">
            <div className="flex items-center justify-center gap-1.5 text-emerald-700 font-semibold">
              <ShieldCheck className="w-4 h-4" />
              <span>Razorpay Verified & Buyer OTP Protected</span>
            </div>
            <p>A unique Delivery OTP will be provided upon order confirmation.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-xs text-gray-400">Loading checkout...</div>}>
      <CheckoutContent />
    </Suspense>
  );
}
