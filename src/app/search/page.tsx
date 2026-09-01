"use client";

import { Suspense, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  Loader2,
  ShoppingBag,
  Wrench,
  HandHeart,
  Droplet,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { parseProductImages } from "@/lib/media";
import { ProductCard } from "@/components/product/ProductCard";
import { useSearch, useSearchProducts } from "@/lib/queries/hooks";
import { useLocationStore } from "@/lib/location/store";
import { SearchResult } from "@/types";
import { highlightQuery, searchResultHref, searchResultLabel, searchTabToApiType } from "@/lib/search/routes";

type Tab = "all" | "products" | "services" | "donations" | "blood";

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { cityName } = useLocationStore();

  const q = searchParams.get("q") || "";
  const tab = (searchParams.get("tab") as Tab) || "all";
  const sort = searchParams.get("sort") || "";
  const page = Number(searchParams.get("page") || "1") || 1;
  const category = searchParams.get("category") || undefined;
  const location = searchParams.get("location") || cityName || undefined;

  const apiType = searchTabToApiType(tab);

  const federatedParams = useMemo(
    () => ({
      q,
      type: apiType,
      category,
      location,
      sort: sort || undefined,
      page,
      limit: 20,
    }),
    [q, apiType, category, location, sort, page]
  );

  const { data: federated, isLoading: loadingFederated } = useSearch(federatedParams);
  const { data: productSearch, isLoading: loadingProducts } = useSearchProducts({
    q,
    category,
    page,
    limit: 20,
  });

  const results = federated?.results ?? [];
  const bloodResults = results.filter(
    (r) => r.type === "blood_request" || r.type === "blood_donor"
  );
  const donationResults = results.filter((r) => r.type === "donation_campaign");
  const displayResults =
    tab === "blood"
      ? bloodResults
      : tab === "donations"
        ? donationResults
        : results;

  const products = (productSearch?.products || []).map((p) => ({
    ...p,
    images: parseProductImages(p),
  }));

  const loading = tab === "products" ? loadingProducts : loadingFederated;
  const total = tab === "products" ? productSearch?.total ?? 0 : federated?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / 20));

  const setParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    if (key !== "page") params.delete("page");
    router.push(`/search?${params.toString()}`);
  };

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "all", label: "All", icon: <Search className="w-3.5 h-3.5" /> },
    { id: "products", label: "Products", icon: <ShoppingBag className="w-3.5 h-3.5" /> },
    { id: "services", label: "Services", icon: <Wrench className="w-3.5 h-3.5" /> },
    { id: "donations", label: "Donations", icon: <HandHeart className="w-3.5 h-3.5" /> },
    { id: "blood", label: "Blood", icon: <Droplet className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <nav className="flex items-center gap-2 text-xs text-gray-500">
        <Link href="/" className="hover:text-gray-900">
          Home
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="font-semibold text-gray-900">Search</span>
      </nav>

      <div className="space-y-4">
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
          {q ? (
            <>
              Results for &ldquo;<span className="text-[var(--primary)]">{q}</span>&rdquo;
            </>
          ) : (
            "Search catalogue"
          )}
        </h1>

        <div className="flex flex-wrap gap-2">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setParam("tab", t.id === "all" ? "" : t.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                tab === t.id
                  ? "bg-[var(--primary)] text-white shadow-sm"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          <select
            value={sort}
            onChange={(e) => setParam("sort", e.target.value)}
            className="text-xs font-semibold px-3 py-2 rounded-xl border border-gray-200 bg-white"
          >
            <option value="">Relevance</option>
            <option value="price_asc">Price: low to high</option>
            <option value="price_desc">Price: high to low</option>
          </select>
          {location && (
            <span className="text-xs text-gray-500">Near: {location}</span>
          )}
          <span className="text-xs text-gray-500 ml-auto">{total} matches</span>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-[var(--primary)] animate-spin" />
          <p className="text-xs text-gray-500 mt-2">Searching catalogue…</p>
        </div>
      ) : tab === "products" ? (
        products.length === 0 ? (
          <EmptySearch q={q} />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {products.map((prod) => (
              <ProductCard key={prod.id} product={prod} />
            ))}
          </div>
        )
      ) : displayResults.length === 0 ? (
        <EmptySearch q={q} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayResults.map((item) => (
            <SearchResultCard key={`${item.type}-${item.id}`} item={item} query={q} />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-4">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setParam("page", String(page - 1))}
            className="p-2 rounded-full border border-gray-200 disabled:opacity-40 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-semibold text-gray-600">
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setParam("page", String(page + 1))}
            className="p-2 rounded-full border border-gray-200 disabled:opacity-40 cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

function SearchResultCard({ item, query }: { item: SearchResult; query: string }) {
  const parts = highlightQuery(item.title, query);
  return (
    <Link
      href={searchResultHref(item)}
      className="shopcart-card p-5 bg-white hover:border-[var(--primary)] transition-all group block"
    >
      <span className="text-[10px] font-bold uppercase tracking-wide text-[var(--primary)] bg-emerald-50 px-2 py-0.5 rounded-full">
        {searchResultLabel(item.type)}
      </span>
      <h3 className="font-bold text-base text-gray-900 mt-2 group-hover:text-[var(--primary)]">
        {parts.before}
        {parts.match && <mark className="bg-amber-100 rounded px-0.5">{parts.match}</mark>}
        {parts.after}
      </h3>
      <p className="text-xs text-gray-500 mt-1 line-clamp-2">{item.subtitle}</p>
    </Link>
  );
}

function EmptySearch({ q }: { q: string }) {
  return (
    <div className="text-center py-20 shopcart-card p-10 bg-white space-y-4">
      <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-400 mx-auto">
        <Search className="w-7 h-7" />
      </div>
      <h3 className="text-lg font-bold text-gray-900">
        {q ? `No matches for "${q}"` : "Enter a search term"}
      </h3>
      <p className="text-sm text-gray-500 max-w-sm mx-auto">
        {q
          ? "Try a shorter word or check spelling — partial matches work automatically."
          : "Search products, services, donations, and blood requests across Paykop."}
      </p>
      <Link href="/" className="inline-flex px-6 py-3 rounded-full shopcart-btn-primary text-xs font-bold">
        Browse Home
      </Link>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-xs text-gray-400">Loading search…</div>}>
      <SearchContent />
    </Suspense>
  );
}
