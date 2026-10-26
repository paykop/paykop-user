"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MediaThumb } from "@/components/ui/MediaThumb";
import {
  Package,
  Plus,
  Trash2,
  ChevronRight,
  Loader2,
  X,
  AlertCircle,
} from "lucide-react";
import { api } from "@/lib/api/endpoints";
import { session } from "@/lib/auth/session";
import { Product, ProductCategory } from "@/types";
import { formatPaise, rupeesToPaise } from "@/lib/money";
import { toast } from "@/lib/toast";
import { uploadViaPresignedUrl } from "@/lib/upload/presignedUpload";
import {
  isKycVerified,
  KYC_REQUIRED_LISTING_MSG,
  isKycBlockedError,
} from "@/lib/kyc";
import { usePermissions } from "@/lib/queries/hooks";
import { listingsBlockReason } from "@/lib/seller/onboarding";
import { SellerReadiness } from "@/types";

export default function SellerProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [kycStatus, setKycStatus] = useState<string | undefined>();
  const [readiness, setReadiness] = useState<SellerReadiness | null>(null);
  const { data: permissions } = usePermissions(session.isAuthenticated());

  // Modal / Form state
  const [showAddModal, setShowAddModal] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priceRupees, setPriceRupees] = useState("");
  const [stock, setStock] = useState("10");
  const [categoryId, setCategoryId] = useState<number>(1);
  const [imageUrl, setImageUrl] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [deliveryScope, setDeliveryScope] = useState<"local_only" | "district_wide" | "state_wide" | "pan_india">("pan_india");
  const [isCodAllowed, setIsCodAllowed] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const onboardingBlock = listingsBlockReason({
    next_onboarding_step: readiness?.next_onboarding_step ?? permissions?.next_onboarding_step,
    is_onboarded: permissions?.is_onboarded,
    kyc_status: readiness?.kyc_status ?? permissions?.kyc_status,
    is_seller_ready: readiness?.is_seller_ready ?? permissions?.is_seller_ready,
  });
  const canAddProducts = isKycVerified(kycStatus) && !onboardingBlock;

  const loadProducts = () =>
    Promise.all([
      api.seller.listProducts().catch(() => []),
      api.categories.getAll().catch(() => []),
    ])
      .then(([prodData, catData]) => {
        setProducts(Array.isArray(prodData) ? prodData : []);
        setCategories(Array.isArray(catData) ? catData : []);
      })
      .finally(() => setLoading(false));

  const fetchProducts = ({ showLoading = false }: { showLoading?: boolean } = {}) => {
    if (showLoading) setLoading(true);
    return loadProducts();
  };

  useEffect(() => {
    if (!session.isAuthenticated()) return;
    loadProducts();
    api.auth
      .getMe()
      .then((me) => {
        setKycStatus(me.kyc_status);
        session.setUser(me);
      })
      .catch(() => {
        setKycStatus(session.getUser()?.kyc_status);
      });
    api.sellers.getReadiness().then(setReadiness).catch(() => setReadiness(null));
  }, []);

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canAddProducts) {
      setErrorMsg(KYC_REQUIRED_LISTING_MSG);
      return;
    }
    if (!title.trim() || !priceRupees) {
      setErrorMsg("Please provide product title and price.");
      return;
    }

    setSaving(true);
    setErrorMsg("");

    const pricePaise = rupeesToPaise(Number(priceRupees));
    let imgs: string[] = imageUrl.trim() ? [imageUrl.trim()] : [];
    if (imageFile) {
      const { publicUrl } = await uploadViaPresignedUrl(imageFile, "product");
      imgs = [publicUrl];
    }
    if (imgs.length === 0) {
      setErrorMsg("Please upload a product image or provide an image URL.");
      setSaving(false);
      return;
    }

    try {
      await api.seller.createProduct({
        title: title.trim(),
        description: description.trim(),
        price: pricePaise,
        stock: Number(stock) || 10,
        category_id: categoryId,
        images: imgs,
        delivery_scope: deliveryScope,
        is_cod_allowed: isCodAllowed,
      });

      setShowAddModal(false);
      setTitle("");
      setDescription("");
      setPriceRupees("");
      setImageUrl("");
      setDeliveryScope("pan_india");
      setIsCodAllowed(true);
      fetchProducts({ showLoading: true });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create product listing";
      setErrorMsg(isKycBlockedError(msg) ? KYC_REQUIRED_LISTING_MSG : msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to remove this product listing?")) return;
    try {
      await api.seller.deleteProduct(id);
      fetchProducts({ showLoading: true });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to delete product");
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
        <Link href="/seller" className="hover:text-gray-900">
          Seller Hub
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="font-semibold text-gray-900">My Product Listings</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
        <div className="min-w-0">
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">
            Seller Product Catalogue
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Manage your store inventory, pricing, and stock for local buyers
          </p>
        </div>

        <button
          type="button"
          onClick={() => canAddProducts && setShowAddModal(true)}
          disabled={!canAddProducts}
          className="px-5 py-2.5 rounded-full shopcart-btn-primary text-xs font-bold flex items-center gap-1.5 self-start cursor-pointer shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="w-4 h-4 text-[var(--accent-green)]" />
          <span>Add New Product</span>
        </button>
      </div>

      {!canAddProducts && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{onboardingBlock || KYC_REQUIRED_LISTING_MSG}</span>
        </div>
      )}

      {/* Products Grid */}
      {loading ? (
        <div className="py-20 text-center">
          <Loader2 className="w-8 h-8 text-[var(--primary)] animate-spin mx-auto" />
          <p className="text-xs text-gray-500 mt-2">Loading seller listings...</p>
        </div>
      ) : products.length === 0 ? (
        <div className="shopcart-card p-12 text-center bg-white space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-[var(--primary)] flex items-center justify-center mx-auto">
            <Package className="w-8 h-8" />
          </div>
          <h3 className="font-bold text-lg text-gray-900">No products listed yet</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            Click &ldquo;Add New Product&rdquo; above to publish your first hyperlocal listing.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((prod) => {
            const img =
              prod.images && prod.images.length > 0
                ? prod.images[0]
                : null;

            return (
              <div
                key={prod.id}
                className="shopcart-card p-4 bg-white flex flex-col justify-between space-y-4 border border-gray-200"
              >
                <div className="space-y-3">
                  <div className="relative pt-[70%] rounded-xl overflow-hidden bg-gray-50">
                    <MediaThumb src={img} alt={prod.title} className="object-cover" />
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                      <span>ID #{prod.id}</span>
                      <span className="font-semibold text-emerald-700">Stock: {prod.stock}</span>
                    </div>
                    <h3 className="font-bold text-sm text-gray-900 line-clamp-1">{prod.title}</h3>
                    <div className="text-base font-black text-[var(--primary)] mt-1">
                      {formatPaise(prod.price)}
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                  <Link
                    href={`/products/${prod.id}`}
                    className="text-xs font-bold text-[var(--primary)] hover:underline"
                  >
                    View Public Page
                  </Link>

                  <button
                    onClick={() => handleDelete(prod.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                    title="Delete Product"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Product Modal */}
      {showAddModal && canAddProducts && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-lg max-h-[90dvh] overflow-y-auto rounded-3xl shadow-2xl border border-gray-100 p-6 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="font-bold text-lg text-gray-900">Add New Product Listing</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-full cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-100">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreateProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Product Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Organic Cold Pressed Mustard Oil (1L)"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Short description of the product..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Price in INR (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    placeholder="e.g. 299"
                    value={priceRupees}
                    onChange={(e) => setPriceRupees(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Stock Quantity *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Department / Category *
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                  {categories.length === 0 && <option value={1}>General Merchandise</option>}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Delivery Scope
                  </label>
                  <select
                    value={deliveryScope}
                    onChange={(e) => setDeliveryScope(e.target.value as typeof deliveryScope)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium"
                  >
                    <option value="pan_india">Pan-India Delivery</option>
                    <option value="state_wide">State-wide Delivery</option>
                    <option value="district_wide">District-wide Delivery</option>
                    <option value="local_only">Local Hyperlocal Only</option>
                  </select>
                </div>

                <div className="flex items-center pt-5 sm:pt-6">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-700 select-none">
                    <input
                      type="checkbox"
                      checked={isCodAllowed}
                      onChange={(e) => setIsCodAllowed(e.target.checked)}
                      className="rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)] w-4 h-4"
                    />
                    <span>Allow Cash on Delivery (COD)</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Product image
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
                  className="w-full text-xs mb-2"
                />
                <input
                  type="url"
                  placeholder="Or paste image URL"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-3 rounded-full shopcart-btn-primary font-bold text-xs flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                >
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Publish Product</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-3 text-xs font-semibold text-gray-500"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
