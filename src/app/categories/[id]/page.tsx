"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Layers, ChevronRight, Loader2, ShoppingBag } from "lucide-react";
import { api } from "@/lib/api/endpoints";
import { ProductCategory } from "@/types";
import { useLocationStore } from "@/lib/location/store";
import { useNearbyProducts } from "@/lib/queries/hooks";
import { ProductCard } from "@/components/product/ProductCard";

export default function CategoryPage() {
  const params = useParams();
  const categoryId = params.id as string;
  const { latitude, longitude, cityName, openModal } = useLocationStore();

  const [category, setCategory] = useState<ProductCategory | null>(null);
  const [categoryLoading, setCategoryLoading] = useState(true);
  const [selectedSubCat, setSelectedSubCat] = useState<number | null>(null);

  const { data: products = [], isLoading: productsLoading } = useNearbyProducts({
    latitude,
    longitude,
    radius: 25,
    limit: 40,
    categoryId: Number(categoryId),
  });

  useEffect(() => {
    api.categories
      .getById(categoryId)
      .then((catData) => setCategory(catData || null))
      .catch(() => setCategory(null))
      .finally(() => setCategoryLoading(false));
  }, [categoryId]);

  const filteredProducts = selectedSubCat
    ? products.filter((p) => p.category_id === selectedSubCat)
    : products;
  const loading = categoryLoading || productsLoading;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <nav className="flex items-center gap-2 text-xs text-gray-500">
        <Link href="/" className="hover:text-gray-900">
          Home
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href="/categories" className="hover:text-gray-900">
          Categories
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="font-semibold text-gray-900 truncate">
          {category?.name || `Department #${categoryId}`}
        </span>
      </nav>

      <div className="rounded-3xl bg-[var(--primary)] text-white p-8 sm:p-10 relative overflow-hidden shadow-md">
        <div className="relative z-10 max-w-xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--accent-green)]/20 text-[var(--accent-green)] text-xs font-bold">
            <Layers className="w-3.5 h-3.5" />
            <span>Hyperlocal Department</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
            {category?.name || "Product Catalog"}
          </h1>
          <p className="text-sm text-white/80">
            Nearby listings in {cityName}. Inventory is limited to sellers within 25 km.
          </p>
        </div>
      </div>

      {category?.children && category.children.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => setSelectedSubCat(null)}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
              selectedSubCat === null
                ? "bg-[var(--primary)] text-white shadow-xs"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            All Subcategories ({products.length})
          </button>
          {category.children.map((sub) => (
            <button
              key={sub.id}
              onClick={() => setSelectedSubCat(sub.id)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                selectedSubCat === sub.id
                  ? "bg-[var(--primary)] text-white shadow-xs"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {sub.name}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-[var(--primary)] animate-spin" />
          <p className="text-xs text-gray-500 mt-2">Loading nearby products...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-20 shopcart-card p-10 bg-white space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-400 mx-auto">
            <ShoppingBag className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">No nearby products in this category</h3>
          <p className="text-sm text-gray-500 max-w-sm mx-auto">
            We only show merchants near {cityName}. Try another location or check back when inventory is listed here.
          </p>
          <button
            onClick={openModal}
            className="inline-flex px-6 py-3 rounded-full shopcart-btn-primary text-xs font-bold cursor-pointer"
          >
            Change location
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {filteredProducts.map((prod) => (
            <ProductCard key={prod.id} product={prod} />
          ))}
        </div>
      )}
    </div>
  );
}
