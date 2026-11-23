"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Star, Heart, ShoppingBag, Zap, Loader2, Check, Sprout } from "lucide-react";
import { Product } from "@/types";
import { formatPaise } from "@/lib/money";
import { api } from "@/lib/api/endpoints";
import { session } from "@/lib/auth/session";
import { parseProductImages } from "@/lib/media";
import { MediaThumb } from "@/components/ui/MediaThumb";
import { toast } from "@/lib/toast";
import { queryKeys } from "@/lib/queries/keys";
import { openFarmModal } from "@/lib/farm/launch";

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
      toast.error(err instanceof Error ? err.message : "Failed to add to cart");
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
            {product.vertical === "farm" ? (
              <span className="inline-flex items-center gap-1 uppercase tracking-wider font-extrabold text-[#1B5E20] bg-emerald-50 px-2 py-0.5 rounded-md text-[10px]">
                <Sprout className="w-3 h-3" />
                <span>Farm Produce</span>
              </span>
            ) : (
              <span className="uppercase tracking-wider font-semibold text-[var(--primary)] text-[10px]">
                {product.category || "General"}
              </span>
            )}
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
          {product.vertical === "farm" && product.farm_name && (
            <p className="text-[11px] text-emerald-800 font-medium mt-0.5 line-clamp-1">
              From: {product.farm_name}
            </p>
          )}
        </div>

        <div className="pt-2 border-t border-slate-100 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-base font-black text-slate-900">
              {formatPaise(product.price)}
              {product.vertical === "farm" && (
                <span className="text-[11px] font-normal text-slate-500 ml-1">
                  /{product.unit || "kg"}
                </span>
              )}
            </div>
            {product.vertical === "farm" ? (
              <div className="text-[10px] text-emerald-700 font-semibold">
                {product.stock_milli && product.stock_milli > 0
                  ? `${product.stock_milli / 1000} ${product.unit || "kg"} available`
                  : "Harvest In Stock"}
              </div>
            ) : product.stock > 0 ? (
              <div className="text-[10px] text-[var(--accent-green)] font-semibold">In Stock</div>
            ) : (
              <div className="text-[10px] text-slate-400 font-semibold">Check availability</div>
            )}
          </div>

          {product.vertical === "farm" ? (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                openFarmModal({ productId: product.id });
              }}
              className="w-full sm:w-auto px-3 py-2.5 min-h-[44px] rounded-xl bg-[#1B5E20] hover:bg-[#2E7D32] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <Sprout className="w-3.5 h-3.5" />
              <span>Farm App</span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5 w-full sm:w-auto">
              <button
                onClick={handleAddToCart}
                disabled={isAdding}
                className={`p-2.5 min-h-[44px] min-w-[44px] rounded-xl text-xs font-semibold cursor-pointer ${
                  isAdded ? "bg-[var(--accent-green)] text-slate-900" : "bg-slate-100 text-[var(--primary)]"
                }`}
              >
                {isAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : isAdded ? <Check className="w-4 h-4" /> : <ShoppingBag className="w-4 h-4" />}
              </button>
              <button onClick={handleBuyNow} className="flex-1 sm:flex-none px-3 py-2.5 min-h-[44px] rounded-xl shopcart-btn-primary text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer">
                <Zap className="w-3.5 h-3.5 text-[var(--accent-green)]" />
                Buy
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
