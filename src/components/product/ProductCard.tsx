"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Star, Heart, ShoppingBag, Zap, Loader2, Check } from "lucide-react";
import { Product } from "@/types";
import { formatPaise } from "@/lib/money";
import { api } from "@/lib/api/endpoints";
import { session } from "@/lib/auth/session";
import { parseProductImages } from "@/lib/media";
import { MediaThumb } from "@/components/ui/MediaThumb";
import { queryKeys } from "@/lib/queries/keys";

export function ProductCard({ product }: { product: Product }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const images = parseProductImages(product);
  const imgSrc = images[0] || null;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!session.isAuthenticated()) {
      window.dispatchEvent(new CustomEvent("paykop_open_login"));
      return;
    }

    setIsAdding(true);
    try {
      await api.cart.add(product.id, 1);
      setIsAdded(true);
      queryClient.invalidateQueries({ queryKey: queryKeys.cart });
      window.dispatchEvent(new Event("paykop_cart_change"));
      setTimeout(() => setIsAdded(false), 2000);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to add to cart");
    } finally {
      setIsAdding(false);
    }
  };

  const handleBuyNow = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    router.push(`/checkout?product_id=${product.id}&quantity=1`);
  };

  const handleToggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!session.isAuthenticated()) {
      window.dispatchEvent(new CustomEvent("paykop_open_login"));
      return;
    }

    try {
      if (isWishlisted) {
        await api.wishlist.remove(product.id);
        setIsWishlisted(false);
      } else {
        await api.wishlist.add(product.id);
        setIsWishlisted(true);
      }
    } catch {
      // ignore
    }
  };

  return (
    <div className="group shopcart-card relative flex flex-col overflow-hidden bg-white">
      <button
        onClick={handleToggleWishlist}
        className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center text-slate-400 hover:text-red-500 cursor-pointer"
        title="Save to Wishlist"
      >
        <Heart className={`w-4 h-4 ${isWishlisted ? "fill-red-500 text-red-500" : ""}`} />
      </button>

      <Link href={`/products/${product.id}`} className="block relative pt-[90%] bg-[var(--primary-subtle)] overflow-hidden">
        <MediaThumb src={imgSrc} alt={product.title} className="object-cover group-hover:scale-105 transition-transform duration-300" />
        {product.distance_km != null && (
          <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full bg-black/60 text-[10px] font-semibold text-white">
            {product.distance_km.toFixed(1)} km away
          </span>
        )}
      </Link>

      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div>
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="uppercase tracking-wider font-semibold text-[var(--primary)] text-[10px]">
              {product.category || "General"}
            </span>
            <div className="flex items-center gap-1 text-slate-700 font-medium">
              <Star className="w-3.5 h-3.5 fill-[var(--accent-yellow)] text-[var(--accent-yellow)]" />
              <span>{(product.average_rating || 0).toFixed(1)}</span>
              {product.review_count != null && (
                <span className="text-slate-400 text-[10px]">({product.review_count})</span>
              )}
            </div>
          </div>
          <Link href={`/products/${product.id}`} className="font-bold text-slate-900 text-sm line-clamp-2 hover:text-[var(--primary)]">
            {product.title || product.name}
          </Link>
        </div>

        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
          <div>
            <div className="text-base font-black text-slate-900">{formatPaise(product.price)}</div>
            {product.stock > 0 ? (
              <div className="text-[10px] text-[var(--accent-green)] font-semibold">In Stock</div>
            ) : (
              <div className="text-[10px] text-slate-400 font-semibold">Check availability</div>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleAddToCart}
              disabled={isAdding}
              className={`p-2 rounded-xl text-xs font-semibold cursor-pointer ${
                isAdded ? "bg-[var(--accent-green)] text-slate-900" : "bg-slate-100 text-[var(--primary)]"
              }`}
            >
              {isAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : isAdded ? <Check className="w-4 h-4" /> : <ShoppingBag className="w-4 h-4" />}
            </button>
            <button onClick={handleBuyNow} className="px-3 py-2 rounded-xl shopcart-btn-primary text-xs font-semibold flex items-center gap-1 cursor-pointer">
              <Zap className="w-3.5 h-3.5 text-[var(--accent-green)]" />
              Buy
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
