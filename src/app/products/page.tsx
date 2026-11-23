"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, Loader2, MapPin, Search, ShoppingBag } from "lucide-react";
import { useLocationStore } from "@/lib/location/store";
import { useNearbyProducts } from "@/lib/queries/hooks";
import { ProductCard } from "@/components/product/ProductCard";

export default function NearbyProductsPage() {
  const { latitude, longitude, cityName, openModal } = useLocationStore();
  const [searchQuery, setSearchQuery] = useState("");
  const { data: products = [], isLoading } = useNearbyProducts({
    latitude,
    longitude,
    radius: 25,
    limit: 40,
  });

  const filtered = products.filter((product) => {
    const q = searchQuery.toLowerCase();
    if (!q) return true;
    return (
      (product.title || product.name || "").toLowerCase().includes(q) ||
      (product.category || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <nav className="flex items-center gap-2 text-xs text-gray-500">
        <Link href="/" className="hover:text-gray-900">
          Home
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="font-semibold text-gray-900">Nearby products</span>
      </nav>

      <div className="rounded-3xl bg-[var(--primary)] text-white p-8 sm:p-10 relative overflow-hidden shadow-md">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--accent-green)]/20 text-[var(--accent-green)] text-xs font-bold">
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Hyperlocal inventory</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight">Products near {cityName}</h1>
          <p className="text-sm text-white/80">
            Only listings from sellers within 25 km of your location.
          </p>
          <div className="pt-2 max-w-md flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search nearby products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white rounded-2xl text-xs text-gray-900 focus:outline-none shadow-md font-medium"
              />
            </div>
            <button
              onClick={openModal}
              className="px-4 py-3 rounded-2xl bg-white/10 border border-white/20 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <MapPin className="w-3.5 h-3.5 text-[var(--accent-yellow)]" />
              {cityName}
            </button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="py-20 text-center">
          <Loader2 className="w-8 h-8 text-[var(--primary)] animate-spin mx-auto" />
          <p className="text-xs text-gray-500 mt-2">Loading products near {cityName}...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="shopcart-card p-12 text-center bg-white space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-gray-100 text-gray-400 flex items-center justify-center mx-auto">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h3 className="font-bold text-lg text-gray-900">No products available nearby</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            We only show inventory from sellers near you. Try another location or check back when merchants list stock.
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
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
