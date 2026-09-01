"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ShoppingBag,
  Trash2,
  Zap,
  ChevronRight,
  Loader2,
  ShieldCheck,
  Truck,
  Info,
} from "lucide-react";
import { CartItem } from "@/types";
import { formatPaise } from "@/lib/money";
import { firstImage } from "@/lib/media";
import { MediaThumb } from "@/components/ui/MediaThumb";
import { Container } from "@/components/ui/Container";
import { useCart, useUpdateCartQty, useRemoveFromCart } from "@/lib/queries/hooks";
import { toast } from "@/lib/toast";

export default function CartPage() {
  const { data: cart, isLoading: loading } = useCart();
  const updateQty = useUpdateCartQty();
  const removeItem = useRemoveFromCart();
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const handleUpdateQty = async (itemId: number, newQty: number) => {
    if (newQty < 1) return;
    setUpdatingId(itemId);
    try {
      await updateQty.mutateAsync({ itemId, quantity: newQty });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update quantity");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRemove = async (itemId: number) => {
    setUpdatingId(itemId);
    try {
      await removeItem.mutateAsync(itemId);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to remove item");
    } finally {
      setUpdatingId(null);
    }
  };

  const parseProductImage = (item: CartItem): string | null => {
    if (item.product?.image && item.product.image.startsWith("http")) {
      return item.product.image;
    }
    if (item.product?.images_json) {
      try {
        const parsed = JSON.parse(item.product.images_json);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed[0];
        }
      } catch {
        // ignore
      }
    }
    return firstImage(item.product?.image);
  };

  const items = cart?.items || [];
  const totalPrice = cart?.total_price || 0;

  return (
    <Container className="py-8 space-y-8">
      <nav className="flex items-center gap-2 text-xs text-gray-500">
        <Link href="/" className="hover:text-gray-900">
          Home
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="font-semibold text-gray-900">Shopping Cart</span>
      </nav>

      <div className="pb-4 border-b border-gray-100">
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
          Your Shopping Cart
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">
          {items.length} {items.length === 1 ? "item" : "items"} ready for hyperlocal fulfillment
        </p>
      </div>

      {loading ? (
        <div className="py-20 text-center">
          <Loader2 className="w-8 h-8 text-[var(--primary)] animate-spin mx-auto" />
          <p className="text-xs text-gray-500 mt-2">Loading your cart items...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="shopcart-card p-12 text-center bg-white space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-gray-100 text-gray-400 flex items-center justify-center mx-auto">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">Your cart is currently empty</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            Browse our neighborhood catalogue and add local products to start your order.
          </p>
          <Link
            href="/"
            className="inline-flex px-8 py-3.5 rounded-full shopcart-btn-primary text-xs font-bold shadow-sm"
          >
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 space-y-4">
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-start gap-3">
              <Info className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-bold">Hyperlocal 1-Click Fulfillment:</span>
                <p className="text-emerald-800">
                  Each product is dispatched directly by its verified local merchant. Click
                  &ldquo;Checkout this item&rdquo; on the product row below to complete instant
                  Razorpay payment.
                </p>
              </div>
            </div>

            <div className="divide-y divide-gray-100 shopcart-card bg-white p-4 sm:p-6 overflow-hidden">
              {items.map((item) => {
                const img = parseProductImage(item);
                const title = item.product?.title || `Product #${item.product_id}`;
                const itemTotal = (item.price || item.product?.price || 0) * item.quantity;
                const isItemUpdating = updatingId === item.id;

                return (
                  <div
                    key={item.id}
                    className="py-5 first:pt-0 last:pb-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-20 h-20 rounded-2xl overflow-hidden relative bg-gray-50 shrink-0 border border-gray-100">
                        <MediaThumb src={img} alt={title} className="object-cover" />
                      </div>
                      <div className="space-y-1">
                        <Link
                          href={`/products/${item.product_id}`}
                          className="font-bold text-sm text-gray-900 hover:text-[var(--primary)] line-clamp-2"
                        >
                          {title}
                        </Link>
                        <div className="text-xs text-gray-500">
                          {formatPaise(item.price || item.product?.price || 0)} per unit
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100 min-w-0">
                      <div className="flex items-center justify-between gap-4 w-full sm:justify-end sm:gap-6">
                        <div className="flex items-center rounded-xl border border-gray-200 bg-gray-50 p-1">
                          <button
                            disabled={isItemUpdating || item.quantity <= 1}
                            onClick={() => handleUpdateQty(item.id, item.quantity - 1)}
                            className="w-7 h-7 rounded-lg bg-white text-gray-700 font-bold flex items-center justify-center hover:bg-gray-100 disabled:opacity-40 cursor-pointer shadow-xs"
                          >
                            -
                          </button>
                          <span className="w-8 text-center font-bold text-xs text-gray-900">
                            {item.quantity}
                          </span>
                          <button
                            disabled={isItemUpdating}
                            onClick={() => handleUpdateQty(item.id, item.quantity + 1)}
                            className="w-7 h-7 rounded-lg bg-white text-gray-700 font-bold flex items-center justify-center hover:bg-gray-100 cursor-pointer shadow-xs"
                          >
                            +
                          </button>
                        </div>

                        <div className="font-black text-sm text-gray-900">
                          {formatPaise(itemTotal)}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto sm:justify-end">
                        <Link
                          href={`/checkout?product_id=${item.product_id}&quantity=${item.quantity}`}
                          className="flex-1 sm:flex-none px-4 py-2.5 min-h-[44px] rounded-xl shopcart-btn-primary text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm"
                        >
                          <Zap className="w-3.5 h-3.5 text-[var(--accent-green)] shrink-0" />
                          <span>Checkout item</span>
                        </Link>

                        <button
                          onClick={() => handleRemove(item.id)}
                          disabled={isItemUpdating}
                          className="p-2.5 min-h-[44px] min-w-[44px] text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer shrink-0"
                          title="Remove from cart"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-4 shopcart-card p-6 bg-white space-y-6">
            <h3 className="font-black text-base text-gray-900 pb-3 border-b border-gray-100">
              Cart Summary
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between text-gray-600">
                <span>Total Items</span>
                <span className="font-bold text-gray-900">{items.length} products</span>
              </div>
              <div className="flex items-center justify-between text-gray-600">
                <span>Estimated Subtotal</span>
                <span className="font-bold text-gray-900">{formatPaise(totalPrice)}</span>
              </div>
              <div className="flex items-center justify-between text-gray-600">
                <span>Delivery</span>
                <span className="font-bold text-emerald-700">Calculated at checkout</span>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 flex items-baseline justify-between">
              <span className="font-bold text-sm text-gray-900">Total Cart Value</span>
              <span className="text-2xl font-black text-[var(--primary)]">{formatPaise(totalPrice)}</span>
            </div>

            <div className="space-y-2 text-[11px] text-gray-500 pt-2 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <Truck className="w-3.5 h-3.5 text-emerald-700" />
                <span>Hyperlocal direct merchant dispatch</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                <span>Razorpay 256-bit SSL secured payment</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </Container>
  );
}
