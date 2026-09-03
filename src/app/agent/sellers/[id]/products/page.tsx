"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ChevronRight, Loader2, Package } from "lucide-react";
import { api } from "@/lib/api/endpoints";
import { ProductCategory } from "@/types";
import { rupeesToPaise } from "@/lib/money";
import { uploadViaPresignedUrl } from "@/lib/upload/presignedUpload";
import { AgentGate } from "@/components/agent/AgentGate";
import { listingsBlockReason } from "@/lib/agent/onboarding";

function CreateProductContent() {
  const params = useParams();
  const router = useRouter();
  const sellerId = params.id as string;

  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loadingCats, setLoadingCats] = useState(true);
  const [gateLoading, setGateLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priceRupees, setPriceRupees] = useState("");
  const [stock, setStock] = useState("10");
  const [categoryName, setCategoryName] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const seller =
          (await api.agent.getOnboardingStatus(sellerId).catch(() => null)) ??
          (await api.agent.getSeller(sellerId));
        const reason = listingsBlockReason(seller);
        if (reason) {
          router.replace(`/agent/sellers/${sellerId}`);
          return;
        }
      } catch {
        router.replace(`/agent/sellers/${sellerId}`);
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
    api.categories
      .getAll()
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setCategories(list);
        if (list[0]?.name) setCategoryName(list[0].name);
      })
      .catch(() => setCategories([]))
      .finally(() => setLoadingCats(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !priceRupees || !categoryName) {
      setErrorMsg("Title, price, and category are required.");
      return;
    }
    const imgs: string[] = [];
    if (imageFile) {
      const { publicUrl } = await uploadViaPresignedUrl(imageFile, "product");
      imgs.push(publicUrl);
    } else if (imageUrl.trim()) {
      imgs.push(imageUrl.trim());
    }
    if (imgs.length === 0) {
      setErrorMsg("Please upload a product image or provide an image URL.");
      return;
    }

    setSaving(true);
    setErrorMsg("");
    try {
      await api.agent.createProduct(sellerId, {
        title: title.trim(),
        description: description.trim(),
        price: rupeesToPaise(Number(priceRupees)),
        stock: Number(stock) || 0,
        category: categoryName,
        images: imgs,
      });
      router.push(`/agent/sellers/${sellerId}?listed=product`);
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

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <nav className="flex items-center gap-2 text-xs text-gray-500 flex-wrap">
        <Link href="/agent" className="hover:text-gray-900">
          Agent Hub
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href={`/agent/sellers/${sellerId}`} className="hover:text-gray-900">
          Seller
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="font-semibold text-gray-900">Add product</span>
      </nav>

      <div className="flex items-center gap-2">
        <Package className="w-5 h-5 text-[var(--primary)]" />
        <h1 className="text-2xl font-black text-gray-900 tracking-tight">Create product for seller</h1>
      </div>

      {errorMsg && (
        <div className="text-xs text-red-600 bg-red-50 p-3 rounded-xl border border-red-100">{errorMsg}</div>
      )}

      {loadingCats ? (
        <div className="py-12 text-center">
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-[var(--primary)]" />
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="shopcart-card p-6 bg-white space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Price (₹)</label>
              <input
                type="number"
                min="1"
                step="0.01"
                value={priceRupees}
                onChange={(e) => setPriceRupees(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Stock</label>
              <input
                type="number"
                min="0"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Category</label>
            <select
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm"
              required
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Product image</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
              className="w-full text-xs"
            />
            <p className="text-[10px] text-gray-400 mt-1">Or paste an image URL below</p>
            <input
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://..."
              className="w-full mt-2 px-3 py-2.5 rounded-xl border border-gray-200 text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 rounded-full shopcart-btn-primary text-xs font-bold disabled:opacity-50 cursor-pointer"
          >
            {saving ? "Creating..." : "Create product"}
          </button>
        </form>
      )}
    </div>
  );
}

export default function AgentCreateProductPage() {
  return (
    <AgentGate>
      <CreateProductContent />
    </AgentGate>
  );
}
