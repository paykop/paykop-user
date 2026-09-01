"use client";

import Link from "next/link";
import { MediaThumb } from "@/components/ui/MediaThumb";
import { Package, ChevronRight, Loader2, Clock, CheckCircle2, XCircle, Truck } from "lucide-react";
import { Order } from "@/types";
import { formatPaise } from "@/lib/money";
import { useOrders } from "@/lib/queries/hooks";

export default function OrdersPage() {
  const { data: orders = [], isLoading: loading } = useOrders();

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "paid":
      case "delivered":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-bold uppercase">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>{status}</span>
          </span>
        );
      case "shipped":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[var(--primary-subtle)] text-[var(--primary)] text-[11px] font-bold uppercase">
            <Truck className="w-3 h-3 text-[var(--primary-light)]" />
            <span>Out for Delivery</span>
          </span>
        );
      case "cancelled":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-50 text-red-800 text-[11px] font-bold uppercase">
            <XCircle className="w-3 h-3 text-red-600" />
            <span>Cancelled</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 text-[11px] font-bold uppercase">
            <Clock className="w-3 h-3 text-amber-600" />
            <span>{status}</span>
          </span>
        );
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <nav className="flex items-center gap-2 text-xs text-gray-500">
        <Link href="/" className="hover:text-gray-900">
          Home
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href="/account" className="hover:text-gray-900">
          Account
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="font-semibold text-gray-900">My Orders</span>
      </nav>

      <div className="pb-4 border-b border-gray-100">
        <h1 className="text-2xl font-black text-gray-900 tracking-tight">Order History</h1>
        <p className="text-xs text-gray-500 mt-0.5">
          Track fulfillment status, view invoices, and access Delivery OTPs
        </p>
      </div>

      {loading ? (
        <div className="py-20 text-center">
          <Loader2 className="w-8 h-8 text-[var(--primary)] animate-spin mx-auto" />
          <p className="text-xs text-gray-500 mt-2">Loading orders...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="shopcart-card p-12 text-center bg-white space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-[var(--primary)] flex items-center justify-center mx-auto">
            <Package className="w-8 h-8" />
          </div>
          <h3 className="font-bold text-lg text-gray-900">No orders placed yet</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            Explore our neighborhood marketplace to purchase items with instant 2-hour local delivery.
          </p>
          <Link
            href="/"
            className="inline-flex px-6 py-3 rounded-full shopcart-btn-primary text-xs font-bold"
          >
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order: Order) => {
            const title = order.product?.title || `Order #${order.id}`;
            const img =
              order.product?.images && order.product.images.startsWith("http")
                ? order.product.images
                : null;

            return (
              <div
                key={order.id}
                className="shopcart-card p-6 bg-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-20 h-20 rounded-2xl overflow-hidden relative bg-gray-50 shrink-0 border border-gray-100">
                    <MediaThumb src={img} alt={title} className="object-cover" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-gray-400">Order #{order.id}</span>
                      {getStatusBadge(order.status)}
                    </div>
                    <h3 className="font-bold text-sm text-gray-900 line-clamp-1">{title}</h3>
                    <div className="text-xs text-gray-500">
                      Quantity: {order.quantity} | Total:{" "}
                      <strong className="text-gray-900 font-bold">
                        {formatPaise(order.total_price)}
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center justify-between sm:justify-end gap-3 w-full sm:w-auto pt-4 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                  {order.delivery_otp && (
                    <div className="p-2.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-center">
                      <span className="text-[10px] font-bold text-emerald-800 uppercase block tracking-wider">
                        Delivery OTP
                      </span>
                      <span className="font-mono font-black text-sm text-emerald-900 tracking-widest">
                        {order.delivery_otp}
                      </span>
                    </div>
                  )}

                  <Link
                    href={`/account/orders/${order.id}`}
                    className="w-full sm:w-auto px-5 py-2.5 min-h-[44px] rounded-full shopcart-btn-primary text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <span>View Details</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
