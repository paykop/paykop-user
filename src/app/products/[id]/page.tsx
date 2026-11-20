"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { MediaThumb } from "@/components/ui/MediaThumb";
import { ReviewsSection } from "@/components/reviews/ReviewsSection";
import Link from "next/link";
import {
  Star,
  ShoppingBag,
  Zap,
  ShieldCheck,
  Truck,
  RotateCcw,
  Store,
  ChevronRight,
  Loader2,
  Check,
  Sprout,
  Scale,
} from "lucide-react";
import { openFarmModal } from "@/lib/farm/launch";
import { parseProductImages } from "@/lib/media";
import { formatPaise } from "@/lib/money";
import { session } from "@/lib/auth/session";
import { toast } from "@/lib/toast";
import { useProduct, useAddToCart } from "@/lib/queries/hooks";
import { ApiError } from "@/lib/api/client";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;

  const { data: rawProduct, isLoading: loading, isError, error } = useProduct(productId);
  const addToCart = useAddToCart();
  const product = useMemo(
    () => (rawProduct ? { ...rawProduct, images: parseProductImages(rawProduct) } : null),
    [rawProduct]
  );

  const [selectedImg, setSelectedImg] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);

  const [trackedId, setTrackedId] = useState(productId);
  if (trackedId !== productId) {
    setTrackedId(productId);
    setSelectedImg("");
    setQuantity(1);
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 text-[var(--primary)] animate-spin" />
        <p className="text-xs text-gray-500 mt-3">Loading product details...</p>
      </div>
    );
  }

  const notPublic =
    isError &&
    error instanceof ApiError &&
    error.status === 403 &&
    (error.code === "product_not_public" || /not public/i.test(error.message));

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-2xl font-bold text-gray-900">
          {notPublic ? "Listing unavailable" : "Product Not Found"}
        </h2>
        <p className="text-sm text-gray-500">
          {notPublic
            ? "This product is no longer available in the marketplace."
            : "The product you are looking for does not exist or has been removed."}
        </p>
        <Link href="/" className="inline-flex px-6 py-3 rounded-full shopcart-btn-primary text-xs font-bold">
          Back to Store
        </Link>
      </div>
    );
  }

  const handleAddToCart = async () => {
    if (!session.isAuthenticated()) {
      window.dispatchEvent(new CustomEvent("paykop_open_login"));
      return;
    }

    try {
      await addToCart.mutateAsync({ productId: product.id, quantity });
      setIsAdded(true);
      setTimeout(() => setIsAdded(false), 2000);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to add to cart");
    } finally {
      // mutation handles loading state
    }
  };

  const handleBuyNow = () => {
    router.push(`/checkout?product_id=${product.id}&quantity=${quantity}`);
  };

  const images = product.images && product.images.length > 0 ? product.images : [];
  const displayImg = selectedImg || images[0] || "";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-gray-500">
        <Link href="/" className="hover:text-gray-900">
          Home
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href="/categories" className="hover:text-gray-900">
          {product.category || "Products"}
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="font-semibold text-gray-900 truncate max-w-xs">{product.title}</span>
      </nav>

      {/* Main PDP Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left: Image Gallery */}
        <div className="lg:col-span-6 space-y-4">
          {/* Main Large Image */}
          <div className="relative pt-[90%] rounded-3xl overflow-hidden bg-gray-50 border border-gray-100 shadow-sm">
            <MediaThumb
              src={displayImg || null}
              alt={product.title}
              className="object-cover"
            />
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-2">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImg(img)}
                  className={`w-20 h-20 rounded-2xl overflow-hidden relative border-2 transition-all cursor-pointer shrink-0 ${
                    displayImg === img ? "border-[var(--primary)] shadow-sm" : "border-gray-200 opacity-70 hover:opacity-100"
                  }`}
                >
                  <MediaThumb src={img} alt={`Thumbnail ${idx + 1}`} className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Product Details & Purchase Actions */}
        <div className="lg:col-span-6 space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              {product.vertical === "farm" ? (
                <span className="text-xs font-extrabold uppercase tracking-widest text-[#1B5E20] bg-emerald-100/80 px-3 py-1 rounded-full flex items-center gap-1.5">
                  <Sprout className="w-3.5 h-3.5" />
                  <span>Farm Produce · Dedicated App</span>
                </span>
              ) : (
                <span className="text-xs font-extrabold uppercase tracking-widest text-[var(--primary)] bg-emerald-50 px-3 py-1 rounded-full">
                  {product.category || "General"}
                </span>
              )}

              <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 bg-gray-50 px-3 py-1 rounded-full">
                <Star className="w-4 h-4 fill-[#ffc220] text-[#ffc220]" />
                {(product.review_count ?? 0) > 0 && product.average_rating != null ? (
                  <>
                    <span>{Number(product.average_rating).toFixed(1)}</span>
                    <span className="text-gray-400 text-xs">
                      ({product.review_count} reviews)
                    </span>
                  </>
                ) : (
                  <span className="text-gray-400 text-xs">No ratings yet</span>
                )}
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight leading-tight">
              {product.title}
            </h1>
          </div>

          {/* Farm Produce Notice & Metadata if Farm Vertical */}
          {product.vertical === "farm" && (
            <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200/90 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-950 uppercase tracking-wider">
                <Sprout className="w-4 h-4 text-emerald-700" />
                <span>Agricultural Produce Notice</span>
              </div>
              <p className="text-xs text-emerald-800 leading-relaxed">
                This item is part of the <strong>Paykop Farm</strong> agricultural vertical. For precision weight-based measurement (kg/grams), harvest freshness guarantees, and direct-from-farmer delivery, this item is ordered exclusively through the Paykop Farm application.
              </p>
              <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] text-emerald-900 border-t border-emerald-200/60">
                {product.farm_name && (
                  <div>
                    <span className="text-emerald-700 font-medium">Farm / FPO:</span>{" "}
                    <strong>{product.farm_name}</strong>
                  </div>
                )}
                {product.farming_method && (
                  <div>
                    <span className="text-emerald-700 font-medium">Farming Method:</span>{" "}
                    <strong className="capitalize">{product.farming_method}</strong>
                  </div>
                )}
                {product.origin_location && (
                  <div>
                    <span className="text-emerald-700 font-medium">Origin:</span>{" "}
                    <strong>{product.origin_location}</strong>
                  </div>
                )}
                {product.shelf_life_days && (
                  <div>
                    <span className="text-emerald-700 font-medium">Shelf Life:</span>{" "}
                    <strong>{product.shelf_life_days} Days</strong>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Price */}
          <div className="p-4 rounded-2xl bg-[var(--canvas)] border border-gray-200 space-y-1">
            <div className="flex flex-wrap items-baseline gap-2 sm:gap-3">
              <span className="text-3xl sm:text-4xl font-black text-[var(--primary)]">
                {formatPaise(product.price)}
              </span>
              {product.vertical === "farm" && (
                <span className="text-sm font-bold text-slate-600">
                  /{product.unit || "kg"}
                </span>
              )}
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md">
                {product.is_tax_exempt || product.vertical === "farm" ? "0% GST Exempt" : "Inclusive of all taxes"}
              </span>
            </div>
            <p className="text-xs text-gray-500">
              {product.vertical === "farm"
                ? "Weight-based precision ordering available on Paykop Farm app."
                : "Direct checkout available for 1 product item with instant Razorpay verification."}
            </p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
              Product Overview
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              {product.description || "High quality verified hyperlocal product sourced directly from local retailers."}
            </p>
          </div>

          {/* Quantity & Action Buttons */}
          {product.vertical === "farm" ? (
            <div className="space-y-4 pt-2 border-t border-gray-100">
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 space-y-2">
                <span className="font-bold block text-sm">
                  🌾 Farm Produce Vertical Isolation
                </span>
                <p className="text-emerald-800 leading-relaxed">
                  To prevent mixing standard retail parcels with delicate perishable produce, this harvest item cannot be checked out in the general retail cart. Orders are placed directly on the <strong>Paykop Farm</strong> app with your same Paykop account.
                </p>
              </div>

              <button
                type="button"
                onClick={() => openFarmModal({ productId: product.id })}
                className="w-full py-4 px-6 rounded-full bg-[#1B5E20] hover:bg-[#2E7D32] text-white font-black text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
              >
                <Sprout className="w-4 h-4 text-emerald-300" />
                <span>Open &amp; Order in Paykop Farm App</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4 pt-2 border-t border-gray-100">
              <div className="flex items-center gap-4">
                <span className="text-xs font-bold text-gray-700">Quantity:</span>
                <div className="flex items-center rounded-xl border border-gray-200 bg-gray-50 p-1">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={product.stock <= 0}
                    className="w-8 h-8 rounded-lg bg-white text-gray-700 font-bold flex items-center justify-center hover:bg-gray-100 shadow-xs cursor-pointer disabled:opacity-40"
                  >
                    -
                  </button>
                  <span className="w-10 text-center font-black text-sm text-gray-900">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                    setQuantity((q) =>
                      product.stock > 0 ? Math.min(product.stock, q + 1) : q
                    )
                  }
                  disabled={product.stock <= 0 || quantity >= product.stock}
                  className="w-8 h-8 rounded-lg bg-white text-gray-700 font-bold flex items-center justify-center hover:bg-gray-100 shadow-xs cursor-pointer disabled:opacity-40"
                >
                  +
                </button>
              </div>
              <span
                className={`text-xs font-semibold ${
                  product.stock > 0 ? "text-emerald-700" : "text-red-600"
                }`}
              >
                {product.stock > 0 ? `${product.stock} units available` : "Out of Stock"}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                onClick={handleAddToCart}
                disabled={addToCart.isPending || product.stock <= 0}
                className={`py-3.5 px-6 rounded-full font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm disabled:opacity-50 ${
                  isAdded
                    ? "bg-emerald-600 text-white"
                    : "bg-gray-100 text-[var(--primary)] hover:bg-[var(--primary-subtle)]"
                }`}
              >
                {addToCart.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin text-[var(--primary)]" />
                ) : isAdded ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Added to Cart</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-4 h-4" />
                    <span>Add to Cart</span>
                  </>
                )}
              </button>

              <button
                onClick={handleBuyNow}
                disabled={product.stock <= 0}
                className="py-3.5 px-6 rounded-full shopcart-btn-primary font-bold text-sm flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
              >
                <Zap className="w-4 h-4 text-[var(--accent-green)]" />
                <span>Buy Now (Instant)</span>
              </button>
            </div>
          </div>
          )}

          {/* Seller / Store Card */}
          <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-[var(--primary)] text-white flex items-center justify-center">
                <Store className="w-5 h-5 text-[var(--accent-green)]" />
              </div>
              <div>
                <div className="text-xs font-bold text-gray-900">
                  Seller ID: {product.seller_id.slice(0, 12)}...
                </div>
                <div className="text-[11px] text-gray-500">Verified Local Merchant</div>
              </div>
            </div>

            <Link
              href="/chat"
              className="w-full sm:w-auto text-center px-3.5 py-2.5 min-h-[44px] rounded-full border border-gray-300 text-xs font-semibold text-gray-700 hover:border-[var(--primary)] hover:text-[var(--primary)] transition-colors flex items-center justify-center"
            >
              Chat Seller
            </Link>
          </div>

          {/* Trust Guarantees */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-center text-xs text-gray-600">
            <div className="p-3 rounded-2xl bg-white border border-gray-100 space-y-1">
              <Truck className="w-5 h-5 text-[var(--primary)] mx-auto" />
              <div className="font-bold text-gray-900 text-[11px]">2-Hour Delivery</div>
            </div>
            <div className="p-3 rounded-2xl bg-white border border-gray-100 space-y-1">
              <ShieldCheck className="w-5 h-5 text-[var(--primary)] mx-auto" />
              <div className="font-bold text-gray-900 text-[11px]">OTP Protected</div>
            </div>
            <div className="p-3 rounded-2xl bg-white border border-gray-100 space-y-1">
              <RotateCcw className="w-5 h-5 text-[var(--primary)] mx-auto" />
              <div className="font-bold text-gray-900 text-[11px]">Local Return</div>
            </div>
          </div>
        </div>
      </div>

      <ReviewsSection
        targetType="product"
        targetId={product.id}
        embedded={product.reviews}
      />
    </div>
  );
}
