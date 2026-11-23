"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ChevronRight,
  Loader2,
  Package,
  Plus,
  X,
  ArrowLeft,
  ExternalLink,
  ImageIcon,
} from "lucide-react";
import { api } from "@/lib/api/endpoints";
import { Product, ProductCategory, AgentSellerSummary, DeliveryScope } from "@/types";
import { formatPaise, rupeesToPaise } from "@/lib/money";
import { uploadViaPresignedUrl } from "@/lib/upload/presignedUpload";
import { AgentGate } from "@/components/agent/AgentGate";
import { listingsBlockReason } from "@/lib/agent/onboarding";
import { MediaThumb } from "@/components/ui/MediaThumb";
import { toast } from "@/lib/toast";

function AgentProductsCatalogueContent() {
  const params = useParams();
  const router = useRouter();
  const sellerId = params.id as string;

  const [seller, setSeller] = useState<AgentSellerSummary | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [gateLoading, setGateLoading] = useState(true);

  // Modal / Add Product Form state
  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priceRupees, setPriceRupees] = useState("");
  const [stock, setStock] = useState("10");
  const [categoryName, setCategoryName] = useState("");
  const [deliveryScope, setDeliveryScope] = useState<DeliveryScope>("pan_india");
  const [isCodAllowed, setIsCodAllowed] = useState(true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState("");

  // Live image preview URL
  const previewUrl = useMemo(() => {
    if (imageFile) {
      return URL.createObjectURL(imageFile);
    }
    return imageUrl.trim() || null;
  }, [imageFile, imageUrl]);

  const loadProducts = () =>
    api.agent
      .getSellerProducts(sellerId)
      .then((data) => setProducts(Array.isArray(data) ? data : []))
      .catch(() => setProducts([]));

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const s =
          (await api.agent.getOnboardingStatus(sellerId).catch(() => null)) ??
          (await api.agent.getSeller(sellerId));
        if (cancelled) return;
        setSeller(s);
        const reason = listingsBlockReason(s);
        if (reason) {
          router.replace(`/agent/sellers/${sellerId}`);
          return;
        }
      } catch {
        if (!cancelled) router.replace(`/agent/sellers/${sellerId}`);
        return;
      } finally {
        if (!cancelled) setGateLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sellerId, router]);

  useEffect(() => {
    Promise.all([
      loadProducts(),
      api.categories.getAll().then((data) => {
        const list = Array.isArray(data) ? data : [];
        setCategories(list);
        if (list[0]?.name) setCategoryName(list[0].name);
      }).catch(() => setCategories([])),
    ]).finally(() => setLoading(false));
  }, [sellerId]);

  const handleResetForm = () => {
    setTitle("");
    setDescription("");
    setPriceRupees("");
    setStock("10");
    setDeliveryScope("pan_india");
    setIsCodAllowed(true);
    setImageFile(null);
    setImageUrl("");
    setErrorMsg("");
    if (categories[0]?.name) setCategoryName(categories[0].name);
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !priceRupees || !categoryName) {
      setErrorMsg("Title, price, and category are required.");
      return;
    }

    setSaving(true);
    setErrorMsg("");

    try {
      const imgs: string[] = [];
      if (imageFile) {
        try {
          const { publicUrl } = await uploadViaPresignedUrl(imageFile, "product");
          imgs.push(publicUrl);
        } catch (uploadErr) {
          const msg = uploadErr instanceof Error ? uploadErr.message : "Image upload failed";
          setErrorMsg(`Failed to upload product image: ${msg}`);
          setSaving(false);
          return;
        }
      } else if (imageUrl.trim()) {
        imgs.push(imageUrl.trim());
      }

      if (imgs.length === 0) {
        setErrorMsg("Please upload a product image or provide an image URL.");
        setSaving(false);
        return;
      }

      await api.agent.createProduct(sellerId, {
        title: title.trim(),
        description: description.trim(),
        price: rupeesToPaise(Number(priceRupees)),
        stock: Number(stock) || 0,
        category: categoryName,
        images: imgs,
        delivery_scope: deliveryScope,
        is_cod_allowed: isCodAllowed,
      });

      toast.success(`Published product "${title.trim()}" successfully!`);
      setShowAddModal(false);
      handleResetForm();
      await loadProducts();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to create product");
    } finally {
      setSaving(false);
    }
  };

  if (gateLoading) {
    return (
      <div className="py-20 text-center">
        <Loader2 className="w-8 h-8 text-[var(--primary)] animate-spin mx-auto" />
        <p className="text-xs text-gray-500 mt-2">Checking onboarding…</p>
      </div>
    );
  }

  const sellerName = seller ? `${seller.first_name} ${seller.last_name}`.trim() : "Seller";

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-gray-500 flex-wrap">
        <Link href="/agent" className="hover:text-gray-900">
          Agent Hub
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href={`/agent/sellers/${sellerId}`} className="hover:text-gray-900">
          {sellerName}
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="font-semibold text-gray-900">Product Catalogue</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
        <div>
          <div className="flex items-center gap-2">
            <Package className="w-6 h-6 text-[var(--primary)]" />
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">
              Product Catalogue
            </h1>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Manage inventory and product uploads on behalf of <strong className="text-gray-800">{sellerName}</strong>
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Link
            href={`/agent/sellers/${sellerId}`}
            className="px-4 py-2.5 rounded-full border border-gray-200 hover:bg-gray-50 text-xs font-semibold text-gray-700 flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Seller Onboarding</span>
          </Link>
          <button
            type="button"
            onClick={() => {
              handleResetForm();
              setShowAddModal(true);
            }}
            className="px-5 py-2.5 rounded-full shopcart-btn-primary text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[var(--accent-green)]" />
            <span>Add New Product</span>
          </button>
        </div>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="py-20 text-center">
          <Loader2 className="w-8 h-8 text-[var(--primary)] animate-spin mx-auto" />
          <p className="text-xs text-gray-500 mt-2">Loading seller products...</p>
        </div>
      ) : products.length === 0 ? (
        <div className="shopcart-card p-12 text-center bg-white space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-[var(--primary)] flex items-center justify-center mx-auto">
            <Package className="w-8 h-8" />
          </div>
          <h3 className="font-bold text-lg text-gray-900">No products uploaded yet</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            This seller does not have any active product listings. Click &ldquo;Add New Product&rdquo; above to publish their first item.
          </p>
          <button
            type="button"
            onClick={() => {
              handleResetForm();
              setShowAddModal(true);
            }}
            className="inline-flex px-5 py-2.5 rounded-full shopcart-btn-primary text-xs font-bold items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[var(--accent-green)]" />
            <span>Add First Product</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((prod) => {
            const img = prod.images && prod.images.length > 0 ? prod.images[0] : null;

            return (
              <div
                key={prod.id}
                className="shopcart-card p-4 bg-white flex flex-col justify-between space-y-4 border border-gray-200 hover:shadow-md transition-shadow"
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
                    target="_blank"
                    className="text-xs font-bold text-[var(--primary)] hover:underline flex items-center gap-1"
                  >
                    <span>View Public Page</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>

                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 uppercase">
                    Live
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-lg max-h-[90dvh] overflow-y-auto rounded-3xl shadow-2xl border border-gray-100 p-6 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h3 className="font-bold text-lg text-gray-900">Add Product for {sellerName}</h3>
                <p className="text-[11px] text-gray-400">Listing will go live immediately on Paykop</p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full cursor-pointer hover:bg-gray-100 transition-colors"
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
                    min="1"
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
                    min="0"
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
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium"
                  required
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                  {categories.length === 0 && <option value="General Merchandise">General Merchandise</option>}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Delivery Scope
                  </label>
                  <select
                    value={deliveryScope}
                    onChange={(e) => setDeliveryScope(e.target.value as DeliveryScope)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium"
                  >
                    <option value="pan_india">Pan India</option>
                    <option value="state_wide">State Wide</option>
                    <option value="district_wide">District Wide</option>
                    <option value="local_only">Local Delivery Only</option>
                  </select>
                </div>

                <div className="pt-5 sm:pt-4">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isCodAllowed}
                      onChange={(e) => setIsCodAllowed(e.target.checked)}
                      className="w-4 h-4 rounded text-[var(--primary)] focus:ring-[var(--primary)]"
                    />
                    <span className="text-xs font-semibold text-gray-700">
                      Allow Cash on Delivery (COD)
                    </span>
                  </label>
                  <p className="text-[10px] text-gray-400 mt-0.5 ml-6">
                    If unchecked, buyers must pay online.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Product Image *
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
                  className="w-full text-xs mb-2 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200 cursor-pointer"
                />

                {previewUrl && (
                  <div className="relative w-24 h-24 rounded-xl overflow-hidden border border-gray-200 mb-2 bg-gray-50">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setImageFile(null);
                        setImageUrl("");
                      }}
                      className="absolute top-1 right-1 p-1 bg-black/60 text-white rounded-full hover:bg-black/80 cursor-pointer"
                      title="Remove image"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}

                <input
                  type="url"
                  placeholder="Or paste an image URL"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-3 rounded-full shopcart-btn-primary font-bold text-xs flex items-center justify-center gap-1.5 shadow-md cursor-pointer disabled:opacity-60"
                >
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{saving ? "Uploading & Publishing…" : "Publish Product"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-3 text-xs font-semibold text-gray-500 hover:text-gray-700"
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

export default function AgentCreateProductPage() {
  return (
    <AgentGate>
      <AgentProductsCatalogueContent />
    </AgentGate>
  );
}
