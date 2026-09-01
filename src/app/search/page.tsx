"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Search, Loader2, ShoppingBag, Wrench, ChevronRight } from "lucide-react";
import { parseProductImages } from "@/lib/media";
import { ProductCard } from "@/components/product/ProductCard";
import { formatPaise } from "@/lib/money";
import { useSearch } from "@/lib/queries/hooks";

function SearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";

  const [activeTab, setActiveTab] = useState<"products" | "services">("products");
  const { data, isLoading: loading } = useSearch(query);
  const products = (data?.products || []).map((p) => ({ ...p, images: parseProductImages(p) }));
  const services = data?.services || [];

  const hasQuery = !!query.trim();
  const displayProducts = hasQuery ? products : [];
  const displayServices = hasQuery ? services : [];
  const showLoading = hasQuery && loading;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-gray-500">
        <Link href="/" className="hover:text-gray-900">
          Home
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="font-semibold text-gray-900">Search Results</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-100">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            Search Results for &ldquo;<span className="text-[var(--primary)]">{query}</span>&rdquo;
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Found {displayProducts.length} products and {displayServices.length} services
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-2xl self-start">
          <button
            onClick={() => setActiveTab("products")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "products"
                ? "bg-white text-[var(--primary)] shadow-xs"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Products ({displayProducts.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("services")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "services"
                ? "bg-white text-[var(--primary)] shadow-xs"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>Services ({displayServices.length})</span>
          </button>
        </div>
      </div>

      {/* Results Body */}
      {showLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-[var(--primary)] animate-spin" />
          <p className="text-xs text-gray-500 mt-2">Searching catalogue...</p>
        </div>
      ) : activeTab === "products" ? (
        displayProducts.length === 0 ? (
          <div className="text-center py-20 shopcart-card p-10 bg-white space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-400 mx-auto">
              <Search className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">No products matched &ldquo;{query}&rdquo;</h3>
            <p className="text-sm text-gray-500 max-w-sm mx-auto">
              Try checking your spelling, using more general keywords, or browsing our department categories.
            </p>
            <Link
              href="/"
              className="inline-flex px-6 py-3 rounded-full shopcart-btn-primary text-xs font-bold"
            >
              Browse Home
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {displayProducts.map((prod) => (
              <ProductCard key={prod.id} product={prod} />
            ))}
          </div>
        )
      ) : displayServices.length === 0 ? (
        <div className="text-center py-20 shopcart-card p-10 bg-white space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-400 mx-auto">
            <Wrench className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">No services matched &ldquo;{query}&rdquo;</h3>
          <p className="text-sm text-gray-500 max-w-sm mx-auto">
            Try searching for another service category or look at available options on the Services page.
          </p>
          <Link
            href="/services"
            className="inline-flex px-6 py-3 rounded-full shopcart-btn-primary text-xs font-bold"
          >
            Explore Services
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayServices.map((service) => (
            <Link
              key={service.id}
              href={`/services/${service.id}`}
              className="shopcart-card p-5 bg-white flex flex-col justify-between hover:border-[var(--primary)] transition-all group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[var(--primary)] bg-emerald-50 px-2.5 py-1 rounded-full">
                    {service.category?.name || "Service"}
                  </span>
                  <span className="text-xs font-bold text-gray-900">
                    {formatPaise(service.fees)}
                  </span>
                </div>
                <h3 className="font-bold text-base text-gray-900 group-hover:text-[var(--primary)] transition-colors">
                  {service.title}
                </h3>
                <p className="text-xs text-gray-500 line-clamp-2">{service.description}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs font-semibold text-[var(--primary)]">
                <span>Book Appointment</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-xs text-gray-400">Loading search...</div>}>
      <SearchContent />
    </Suspense>
  );
}
