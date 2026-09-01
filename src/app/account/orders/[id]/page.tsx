"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { MediaThumb } from "@/components/ui/MediaThumb";
import Link from "next/link";
import {
  ChevronRight,
  Loader2,
  KeyRound,
} from "lucide-react";
import { api } from "@/lib/api/endpoints";
import { Order } from "@/types";
import { formatPaise } from "@/lib/money";
import { toast } from "@/lib/toast";

export default function OrderDetailPage() {
  const params = useParams();
  const orderId = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    api.orders
      .getById(orderId)
      .then((data) => setOrder(data))
      .catch(() => setOrder(null))
      .finally(() => setLoading(false));

    api.orders
      .getPayment(orderId)
      .then((p) => setPaymentStatus(p.status))
      .catch(() => setPaymentStatus(null));
  }, [orderId]);

  const handleCancelOrder = async () => {
    if (!confirm("Are you sure you want to cancel this order?")) return;
    setCancelling(true);
    try {
      await api.orders.cancel(orderId);
      setMsg("Order cancelled successfully.");
      setLoading(true);
      api.orders
        .getById(orderId)
        .then((data) => setOrder(data))
        .catch(() => setOrder(null))
        .finally(() => setLoading(false));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to cancel order");
    } finally {
      setCancelling(false);
    }
  };

  const handleRegenerateOtp = async () => {
    setRegenerating(true);
    try {
      const res = await api.orders.regenerateOtp(orderId);
      setOrder((prev) => (prev ? { ...prev, delivery_otp: res.delivery_otp } : prev));
      toast.success("New delivery OTP generated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to regenerate OTP");
    } finally {
      setRegenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-[var(--primary)] animate-spin" />
        <p className="text-xs text-gray-500 mt-2">Loading order #{orderId}...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-xl font-bold text-gray-900">Order #{orderId} not found</h2>
        <Link href="/account/orders" className="inline-flex px-6 py-3 rounded-full shopcart-btn-primary text-xs font-bold">
          View All Orders
        </Link>
      </div>
    );
  }

  const title = order.product?.title || `Product #${order.product_id}`;
  const img =
    order.product?.images && order.product.images.startsWith("http")
      ? order.product.images
      : null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-gray-500">
        <Link href="/" className="hover:text-gray-900">
          Home
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href="/account/orders" className="hover:text-gray-900">
          My Orders
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="font-semibold text-gray-900">Order #{order.id}</span>
      </nav>

      {msg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800">
          {msg}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">
              Order #{order.id}
            </h1>
            <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold uppercase">
              {order.status}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Placed on {new Date(order.created_at).toLocaleString()}
          </p>
        </div>

        {["pending", "paid"].includes(order.status.toLowerCase()) && (
          <button
            onClick={handleCancelOrder}
            disabled={cancelling}
            className="px-4 py-2 rounded-xl text-xs font-bold text-red-600 border border-red-200 hover:bg-red-50 transition-colors cursor-pointer self-start sm:self-auto"
          >
            {cancelling ? "Cancelling..." : "Cancel Order"}
          </button>
        )}
      </div>

      {/* Delivery OTP Banner (Crucial for physical buyer handover) */}
      {order.delivery_otp && order.status.toLowerCase() !== "cancelled" && (
        <div className="p-6 rounded-3xl bg-[var(--primary)] text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md">
          <div className="flex items-center gap-3 text-center sm:text-left flex-col sm:flex-row">
            <div className="w-12 h-12 rounded-2xl bg-[var(--accent-green)] text-[var(--primary-dark)] flex items-center justify-center">
              <KeyRound className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Your Delivery Verification OTP</h3>
              <p className="text-xs text-white/70">
                Share this OTP with the delivery person only after inspecting your product package.
              </p>
            </div>
          </div>

          <div className="px-6 py-2.5 rounded-2xl bg-white text-[var(--primary)] text-center font-mono font-black text-2xl tracking-widest shadow-inner">
            {order.delivery_otp}
          </div>
          <button
            type="button"
            onClick={handleRegenerateOtp}
            disabled={regenerating}
            className="text-xs font-bold underline text-white/90 cursor-pointer disabled:opacity-50"
          >
            Regenerate OTP
          </button>
        </div>
      )}

      {paymentStatus && (
        <p className="text-xs text-gray-500">
          Payment status: <span className="font-bold text-gray-800">{paymentStatus}</span>
        </p>
      )}

      {/* Item Details Card */}
      <div className="shopcart-card p-6 bg-white space-y-6">
        <h3 className="font-black text-base text-gray-900 pb-3 border-b border-gray-100">
          Purchased Item
        </h3>

        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-2xl overflow-hidden relative bg-gray-50 shrink-0 border border-gray-100">
            <MediaThumb src={img} alt={title} className="object-cover" />
          </div>
          <div className="space-y-1 flex-1">
            <h4 className="font-bold text-sm text-gray-900">{title}</h4>
            <div className="text-xs text-gray-500">
              Quantity: {order.quantity} x {formatPaise(order.product?.price || order.total_price / order.quantity)}
            </div>
            <div className="text-sm font-black text-[var(--primary)] pt-1">
              Total: {formatPaise(order.total_price)}
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-gray-600">
          <div>
            <span className="font-bold text-gray-900 block mb-1">Seller Identity:</span>
            <span>{order.seller_id}</span>
          </div>
          <div>
            <span className="font-bold text-gray-900 block mb-1">Delivery Scope:</span>
            <span>Local Hyperlocal Dispatch</span>
          </div>
        </div>
      </div>
    </div>
  );
}
