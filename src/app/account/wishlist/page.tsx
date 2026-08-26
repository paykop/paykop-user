"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { MediaThumb } from "@/components/ui/MediaThumb";
import { Heart, Trash2, ShoppingBag, ChevronRight, Loader2 } from "lucide-react";
import { api } from "@/lib/api/endpoints";
import { session } from "@/lib/auth/session";
import { WishlistItem } from "@/types";
import { formatPaise } from "@/lib/money";

export default function WishlistPage() {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session.isAuthenticated()) return;
    api.wishlist
      .list()
      .then((data) => setItems(Array.isArray(data) ? data : []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  const handleRemove = async (productId: number) => {
    try {
      await api.wishlist.remove(productId);
      setItems((prev) => prev.filter((it) => it.product_id !== productId));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to remove item");
    }
  };

  const handleAddToCart = async (productId: number) => {
    try {
      await api.cart.add(productId, 1);
      window.dispatchEvent(new Event("paykop_auth_change"));
      alert("Added to cart!");
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to add to cart");
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-gray-500">
        <Link href="/" className="hover:text-gray-900">
          Home
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href="/account" className="hover:text-gray-900">
          Account
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="font-semibold text-gray-900">Wishlist</span>
      </nav>

      {/* Header */}
      <div className="pb-4 border-b border-gray-100">
        <h1 className="text-2xl font-black text-gray-900 tracking-tight">Saved Wishlist</h1>
        <p className="text-xs text-gray-500 mt-0.5">
          Items you&apos;ve saved for future orders in your area
        </p>
      </div>

      {loading ? (
        <div className="py-20 text-center">
          <Loader2 className="w-8 h-8 text-[var(--primary)] animate-spin mx-auto" />
          <p className="text-xs text-gray-500 mt-2">Loading wishlist...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="shopcart-card p-12 text-center bg-white space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-pink-50 text-pink-600 flex items-center justify-center mx-auto">
            <Heart className="w-7 h-7" />
          </div>
          <h3 className="font-bold text-lg text-gray-900">Your wishlist is empty</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            Tap the heart icon on any product card to save items to your personal wishlist.
          </p>
          <Link
            href="/"
            className="inline-flex px-6 py-3 rounded-full shopcart-btn-primary text-xs font-bold"
          >
            Explore Marketplace
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => {
            const product = item.product || {
              id: item.product_id,
              title: `Product #${item.product_id}`,
              price: 0,
              images: [],
            };
            const img =
              product.images && product.images.length > 0
                ? product.images[0]
                : null;

            return (
              <div
                key={item.id}
                className="shopcart-card p-4 bg-white flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="relative pt-[70%] rounded-xl overflow-hidden bg-gray-50">
                    <MediaThumb src={img} alt={product.title} className="object-cover" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-gray-900 line-clamp-2">
                      {product.title}
                    </h3>
                    <div className="text-base font-black text-[var(--primary)] mt-1">
                      {formatPaise(product.price)}
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleAddToCart(product.id)}
                    className="flex-1 py-2 px-3 rounded-xl shopcart-btn-primary text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <ShoppingBag className="w-3.5 h-3.5 text-[var(--accent-green)]" />
                    <span>Add to Cart</span>
                  </button>

                  <button
                    onClick={() => handleRemove(item.product_id)}
                    className="p-2 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                    title="Remove from Wishlist"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
