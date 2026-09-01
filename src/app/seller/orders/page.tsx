"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, Loader2, Package, CheckCircle2 } from "lucide-react";
import { useSellerOrders } from "@/lib/queries/hooks";
import { api } from "@/lib/api/endpoints";
import { formatPaise } from "@/lib/money";
import { toast } from "@/lib/toast";

export default function SellerOrdersPage() {
  const { data: orders = [], isLoading, refetch } = useSellerOrders();
  const [verifyingId, setVerifyingId] = useState<number | null>(null);
  const [otpInput, setOtpInput] = useState<Record<number, string>>({});

  const handleVerifyCod = async (orderId: number) => {
    const otp = otpInput[orderId]?.trim();
    if (!otp) {
      toast.error("Enter delivery OTP");
      return;
    }
    setVerifyingId(orderId);
    try {
      await api.seller.verifyCod(orderId, otp);
      toast.success("COD verified");
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setVerifyingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="py-20 text-center">
        <Loader2 className="w-8 h-8 text-[var(--primary)] animate-spin mx-auto" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <nav className="flex items-center gap-2 text-xs text-gray-500">
        <Link href="/seller" className="hover:text-gray-900">
          Seller Hub
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="font-semibold text-gray-900">Orders</span>
      </nav>

      <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
        <Package className="w-6 h-6 text-[var(--primary)]" /> Incoming Orders
      </h1>

      {orders.length === 0 ? (
        <p className="text-sm text-gray-500 py-12 text-center">No orders yet.</p>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="shopcart-card p-5 bg-white space-y-3">
              <div className="flex justify-between items-start gap-2">
                <div>
                  <p className="font-bold text-gray-900">Order #{order.id}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {order.product?.title || `Product #${order.product_id}`}
                  </p>
                  <p className="text-sm font-bold text-[var(--primary)] mt-1">
                    {formatPaise(order.total_price)} · Qty {order.quantity}
                  </p>
                </div>
                <span className="text-[10px] font-bold uppercase px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                  {order.status}
                </span>
              </div>

              {order.status !== "delivered" && order.status !== "cancelled" && (
                <div className="flex flex-wrap gap-2 items-center pt-2 border-t border-gray-100">
                  <input
                    placeholder="Delivery OTP"
                    value={otpInput[order.id] ?? ""}
                    onChange={(e) =>
                      setOtpInput((prev) => ({ ...prev, [order.id]: e.target.value }))
                    }
                    className="px-3 py-2 rounded-xl border border-gray-200 text-xs w-32"
                  />
                  <button
                    type="button"
                    onClick={() => handleVerifyCod(order.id)}
                    disabled={verifyingId === order.id}
                    className="px-4 py-2 rounded-full shopcart-btn-primary text-xs font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Verify COD
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
