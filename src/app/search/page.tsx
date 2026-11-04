"use client";

import { Suspense, useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  Loader2,
  ShoppingBag,
  Wrench,
  HandHeart,
  Droplet,
  Store,
  ChevronRight,
  ChevronLeft,
  X,
  MapPin,
  SlidersHorizontal,
  ArrowRight,
  Sparkles,
  Heart,
  Calendar,
  ExternalLink,
} from "lucide-react";
import { parseProductImages } from "@/lib/media";
import { ProductCard } from "@/components/product/ProductCard";
import { useSearch, useSearchProducts, useCategories } from "@/lib/queries/hooks";
import { useLocationStore } from "@/lib/location/store";
import { SearchResult } from "@/types";
import {
  highlightQuery,
  searchResultHref,
  searchResultLabel,
  searchTabToApiType,
} from "@/lib/search/routes";

type Tab = "all" | "products" | "services" | "donations" | "blood";

const POPULAR_SEARCH_TAGS = [
  "Wooden Toys",
  "Chocolate",
  "Laptop Service",
  "Carpenter",
  "Emergency Surgery",
  "O+ Blood",
  "Groceries",
  "Fashion",
];

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { cityName, openModal: openLocationModal } = useLocationStore();

  const q = searchParams.get("q") || "";
  const tab = (searchParams.get("tab") as Tab) || "all";
  const sort = searchParams.get("sort") || "";
  const page = Number(searchParams.get("page") || "1") || 1;
  const category = searchParams.get("category") || "";
  const location = searchParams.get("location") || "";

  // Local state for the prominent in-page search bar
  const [searchInput, setSearchInput] = useState(q);

  useEffect(() => {
    setSearchInput(q);
  }, [q]);

  const { data: categories = [] } = useCategories();

  const apiType = searchTabToApiType(tab);

  const federatedParams = useMemo(
    () => ({
      q: q || undefined,
      type: apiType,
      category: category || undefined,
      location: location || cityName || undefined,
      sort: sort || undefined,
      page,
      limit: 20,
    }),
    [q, apiType, category, location, cityName, sort, page]
  );

  const { data: federated, isLoading: loadingFederated } = useSearch(federatedParams);
  const { data: productSearch, isLoading: loadingProducts } = useSearchProducts({
    q: q || undefined,
    category: category || undefined,
    page,
    limit: 20,
  });

  const results = federated?.results ?? [];
  const bloodResults = results.filter(
    (r) => r.type === "blood_request" || r.type === "blood_donor"
  );
  const donationResults = results.filter((r) => r.type === "donation_campaign");
  const serviceResults = results.filter((r) => r.type === "service");

  const displayResults =
    tab === "blood"
      ? bloodResults
      : tab === "donations"
      ? donationResults
      : tab === "services"
      ? serviceResults
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

  const handleInPageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setParam("q", searchInput.trim());
  };

  const clearAllFilters = () => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    router.push(`/search?${params.toString()}`);
  };

  const hasActiveFilters = !!(category || sort || location || (tab !== "all"));

  const tabs: { id: Tab; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: "all", label: "All Items", icon: <Search className="w-3.5 h-3.5" /> },
    {
      id: "products",
      label: "Products",
      icon: <ShoppingBag className="w-3.5 h-3.5" />,
      count: tab === "products" ? total : undefined,
    },
    {
      id: "services",
      label: "Services",
      icon: <Wrench className="w-3.5 h-3.5" />,
      count: tab === "all" ? serviceResults.length : undefined,
    },
    {
      id: "donations",
      label: "Donations",
      icon: <HandHeart className="w-3.5 h-3.5" />,
      count: tab === "all" ? donationResults.length : undefined,
    },
    {
      id: "blood",
      label: "Blood Bank",
      icon: <Droplet className="w-3.5 h-3.5 text-red-500" />,
      count: tab === "all" ? bloodResults.length : undefined,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs text-gray-500">
        <Link href="/" className="hover:text-gray-900 transition-colors">
          Home
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="font-semibold text-gray-900">Catalogue Search</span>
      </nav>

      {/* Hero In-Page Search Header */}
      <div className="rounded-3xl bg-gradient-to-r from-[var(--primary)] via-[var(--primary-dark)] to-slate-900 text-white p-6 sm:p-10 shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-[var(--accent-green)] text-xs font-bold backdrop-blur-xs">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Hyperlocal Federated Search</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
            {q ? (
              <>
                Search results for &ldquo;<span className="text-[var(--accent-green)]">{q}</span>&rdquo;
              </>
            ) : (
              "Discover Products, Services & Community Causes"
            )}
          </h1>

          <form onSubmit={handleInPageSubmit} className="relative flex items-center max-w-2xl">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search products, services, campaigns, blood requests…"
              className="w-full pl-5 pr-28 py-3.5 bg-white text-gray-900 rounded-2xl text-sm font-medium shadow-lg outline-none placeholder:text-gray-400 focus:ring-4 focus:ring-[var(--accent-green)]/20"
            />
            <div className="absolute right-2 flex items-center gap-1.5">
              {searchInput.trim() && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchInput("");
                    setParam("q", "");
                  }}
                  className="p-1.5 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                  aria-label="Clear input"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
              >
                <Search className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Search</span>
              </button>
            </div>
          </form>

          {/* Quick Suggestions / Trending Tags */}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
            <span className="text-white/60 font-medium">Trending:</span>
            {POPULAR_SEARCH_TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => {
                  setSearchInput(tag);
                  setParam("q", tag);
                }}
                className="px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white/90 text-[11px] font-semibold transition-colors cursor-pointer backdrop-blur-xs"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs & Filter Control Strip */}
      <div className="space-y-4">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-gray-100">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setParam("tab", t.id === "all" ? "" : t.id)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 whitespace-nowrap cursor-pointer transition-all ${
                tab === t.id
                  ? "bg-[var(--primary)] text-white shadow-md shadow-[var(--primary)]/20 scale-[1.02]"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900"
              }`}
            >
              {t.icon}
              <span>{t.label}</span>
              {typeof t.count === "number" && t.count > 0 && (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                    tab === t.id ? "bg-white/25 text-white" : "bg-gray-200 text-gray-700"
                  }`}
                >
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Filter Controls Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-gray-50/80 p-3.5 rounded-2xl border border-gray-200/60">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700">
              <SlidersHorizontal className="w-3.5 h-3.5 text-gray-500" />
              <span>Filters:</span>
            </div>

            {/* Category Dropdown */}
            <select
              value={category}
              onChange={(e) => setParam("category", e.target.value)}
              className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-gray-200 bg-white text-gray-800 outline-none focus:border-[var(--primary)] cursor-pointer"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>

            {/* Sort Dropdown */}
            <select
              value={sort}
              onChange={(e) => setParam("sort", e.target.value)}
              className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-gray-200 bg-white text-gray-800 outline-none focus:border-[var(--primary)] cursor-pointer"
            >
              <option value="">Sort: Relevance</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>

            {/* Location Pill */}
            <button
              type="button"
              onClick={openLocationModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-gray-200 text-xs font-semibold text-gray-700 hover:border-gray-300 transition-colors cursor-pointer"
              title="Change search location"
            >
              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
              <span>{location || cityName || "Choose Location"}</span>
            </button>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="text-xs font-bold text-red-600 hover:text-red-700 underline px-2 cursor-pointer"
              >
                Reset filters
              </button>
            )}
          </div>

          <div className="text-xs font-bold text-gray-500">
            {loading ? (
              <span className="flex items-center gap-1.5">
                <Loader2 className="w-3 h-3 animate-spin text-[var(--primary)]" />
                Updating…
              </span>
            ) : (
              <span>{total} results found</span>
            )}
          </div>
        </div>
      </div>

      {/* Main Results View */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 space-y-3">
          <Loader2 className="w-10 h-10 text-[var(--primary)] animate-spin" />
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            Searching catalogue across Paykop…
          </p>
        </div>
      ) : tab === "products" ? (
        products.length === 0 ? (
          <EmptySearch q={q} onClear={clearAllFilters} />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {products.map((prod) => (
              <ProductCard key={prod.id} product={prod} />
            ))}
          </div>
        )
      ) : displayResults.length === 0 ? (
        <EmptySearch q={q} onClear={clearAllFilters} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {displayResults.map((item) => (
            <SearchResultCard key={`${item.type}-${item.id}`} item={item} query={q} />
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && !loading && (
        <div className="flex items-center justify-center gap-3 pt-6 border-t border-gray-100">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setParam("page", String(page - 1))}
            className="p-2.5 rounded-full border border-gray-200 disabled:opacity-40 hover:bg-gray-50 cursor-pointer transition-colors"
            aria-label="Previous page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-bold text-gray-700 px-3 py-1.5 rounded-xl bg-gray-100">
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setParam("page", String(page + 1))}
            className="p-2.5 rounded-full border border-gray-200 disabled:opacity-40 hover:bg-gray-50 cursor-pointer transition-colors"
            aria-label="Next page"
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
  const href = searchResultHref(item);

  // Type-specific badge and styling
  let badgeLabel = searchResultLabel(item.type);
  let badgeColor = "bg-slate-100 text-slate-700";
  let actionLabel = "View Details";
  let IconComponent = Search;

  if (item.type === "product") {
    badgeLabel = "Product";
    badgeColor = "bg-blue-50 text-blue-700 border-blue-200";
    actionLabel = "View Product";
    IconComponent = ShoppingBag;
  } else if (item.type === "service") {
    badgeLabel = "Home Service";
    badgeColor = "bg-amber-50 text-amber-700 border-amber-200";
    actionLabel = "Book Service";
    IconComponent = Wrench;
  } else if (item.type === "donation_campaign") {
    badgeLabel = "Emergency Cause";
    badgeColor = "bg-pink-50 text-pink-700 border-pink-200";
    actionLabel = "Support Cause";
    IconComponent = HandHeart;
  } else if (item.type === "blood_request") {
    badgeLabel = "Blood Needed";
    badgeColor = "bg-red-50 text-red-700 border-red-200";
    actionLabel = "View Request";
    IconComponent = Droplet;
  } else if (item.type === "blood_donor") {
    badgeLabel = "Volunteer Donor";
    badgeColor = "bg-rose-50 text-rose-700 border-rose-200";
    actionLabel = "Contact Donor";
    IconComponent = Droplet;
  } else if (item.type === "user") {
    badgeLabel = "Merchant / Seller";
    badgeColor = "bg-emerald-50 text-emerald-700 border-emerald-200";
    actionLabel = "Visit Profile";
    IconComponent = Store;
  }

  return (
    <Link
      href={href}
      className="shopcart-card p-5 bg-white flex flex-col justify-between hover:border-[var(--primary)] hover:shadow-lg transition-all group rounded-2xl border border-gray-100"
    >
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${badgeColor}`}
          >
            <IconComponent className="w-3.5 h-3.5" />
            <span>{badgeLabel}</span>
          </span>

          {item.score && item.score >= 1 ? (
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
              Top Match
            </span>
          ) : null}
        </div>

        <div>
          <h3 className="font-bold text-base text-gray-900 group-hover:text-[var(--primary)] transition-colors line-clamp-2 leading-snug">
            {parts.before}
            {parts.match && (
              <mark className="bg-amber-100 text-gray-900 rounded px-1">{parts.match}</mark>
            )}
            {parts.after}
          </h3>

          <p className="text-xs text-gray-500 line-clamp-2 mt-1.5 leading-relaxed">
            {item.subtitle || "Verified listing on Paykop hyperlocal platform."}
          </p>
        </div>
      </div>

      <div className="pt-4 mt-4 border-t border-gray-100 flex items-center justify-between text-xs font-bold text-[var(--primary)]">
        <span>{actionLabel}</span>
        <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
      </div>
    </Link>
  );
}

function EmptySearch({ q, onClear }: { q: string; onClear: () => void }) {
  return (
    <div className="text-center py-20 shopcart-card p-10 bg-white rounded-3xl border border-gray-100 space-y-4 max-w-lg mx-auto shadow-sm">
      <div className="w-16 h-16 rounded-3xl bg-[var(--surface-muted)] flex items-center justify-center text-gray-400 mx-auto shadow-inner">
        <Search className="w-8 h-8 text-[var(--primary)]" />
      </div>

      <h3 className="text-lg font-black text-gray-900">
        {q ? `No results found for "${q}"` : "Search Paykop Marketplace"}
      </h3>

      <p className="text-xs text-gray-500 leading-relaxed max-w-sm mx-auto">
        {q
          ? "We couldn't find exact matches for your search term. Try checking for spelling errors, clearing specific filters, or browsing our top departments."
          : "Discover nearby stores, book emergency services, and support local verified NGO fundraisers in your city."}
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        <button
          type="button"
          onClick={onClear}
          className="px-5 py-2.5 rounded-full shopcart-btn-primary text-xs font-bold cursor-pointer"
        >
          Reset All Filters
        </button>
        <Link
          href="/categories"
          className="px-5 py-2.5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold transition-colors"
        >
          Browse Categories
        </Link>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="py-24 text-center space-y-3">
          <Loader2 className="w-8 h-8 text-[var(--primary)] animate-spin mx-auto" />
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Loading search catalogue…
          </p>
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
