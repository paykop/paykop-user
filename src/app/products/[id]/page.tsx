"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { MediaThumb } from "@/components/ui/MediaThumb";
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
} from "lucide-react";
import { api } from "@/lib/api/endpoints";
import { Product } from "@/types";
import { parseProductImages } from "@/lib/media";
import { formatPaise } from "@/lib/money";
import { session } from "@/lib/auth/session";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImg, setSelectedImg] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [isAdded, setIsAdded] = useState(false);

  useEffect(() => {
    api.products
      .getById(productId)
      .then((data) => {
        setProduct({ ...data, images: parseProductImages(data) });
        const imgs = parseProductImages(data);
        setSelectedImg(imgs[0] || "");
        setQuantity(1);
      })
      .catch((err) => {
        console.error("Product fetch error:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [productId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 text-[var(--primary)] animate-spin" />
        <p className="text-xs text-gray-500 mt-3">Loading product details...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-2xl font-bold text-gray-900">Product Not Found</h2>
        <p className="text-sm text-gray-500">The product you are looking for does not exist or has been removed.</p>
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

    setIsAdding(true);
    try {
      await api.cart.add(product.id, quantity);
      setIsAdded(true);
      setTimeout(() => setIsAdded(false), 2000);
      window.dispatchEvent(new Event("paykop_cart_change"));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to add to cart");
    } finally {
      setIsAdding(false);
    }
  };

  const handleBuyNow = () => {
    router.push(`/checkout?product_id=${product.id}&quantity=${quantity}`);
  };

  const images = product.images && product.images.length > 0
    ? product.images
    : [selectedImg];

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
              src={selectedImg || null}
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
                    selectedImg === img ? "border-[var(--primary)] shadow-sm" : "border-gray-200 opacity-70 hover:opacity-100"
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
              <span className="text-xs font-extrabold uppercase tracking-widest text-[var(--primary)] bg-emerald-50 px-3 py-1 rounded-full">
                {product.category || "General"}
              </span>

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

          {/* Price */}
          <div className="p-4 rounded-2xl bg-[var(--canvas)] border border-gray-200 space-y-1">
            <div className="flex items-baseline gap-3">
              <span className="text-3xl sm:text-4xl font-black text-[var(--primary)]">
                {formatPaise(product.price)}
              </span>
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md">
                Inclusive of all taxes
              </span>
            </div>
            <p className="text-xs text-gray-500">
              Direct checkout available for 1 product item with instant Razorpay verification.
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
                disabled={isAdding || product.stock <= 0}
                className={`py-3.5 px-6 rounded-full font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm disabled:opacity-50 ${
                  isAdded
                    ? "bg-emerald-600 text-white"
                    : "bg-gray-100 text-[var(--primary)] hover:bg-[var(--primary-subtle)]"
                }`}
              >
                {isAdding ? (
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

          {/* Seller / Store Card */}
          <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
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
              className="px-3.5 py-1.5 rounded-full border border-gray-300 text-xs font-semibold text-gray-700 hover:border-[var(--primary)] hover:text-[var(--primary)] transition-colors"
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

      {/* Customer Reviews Section */}
      <section className="pt-8 border-t border-gray-200 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Verified Customer Reviews</h2>
            <p className="text-xs text-gray-500">Real feedback from verified local buyers</p>
          </div>
        </div>

        {product.reviews && product.reviews.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {product.reviews.map((rev) => (
              <div key={rev.id} className="shopcart-card p-4 bg-white space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${
                          i < rev.rating
                            ? "fill-[#ffc220] text-[#ffc220]"
                            : "text-gray-200"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-[10px] text-gray-400">
                    {new Date(rev.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-xs text-gray-700 leading-relaxed">{rev.comment}</p>
                <div className="text-[11px] font-semibold text-gray-500">
                  {rev.user_email || "Verified Buyer"}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="shopcart-card p-6 bg-white text-center text-xs text-gray-500">
            No customer reviews yet. Be the first to order and review this product!
          </div>
        )}
      </section>
    </div>
  );
}
