"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useQueryClient } from "@tanstack/react-query";
import {
  Search,
  ShoppingCart,
  User as UserIcon,
  MapPin,
  ChevronDown,
  Menu,
  X,
  Heart,
  Package,
  Layers,
  Sparkles,
  LogOut,
  HandHeart,
  Droplet,
  Wrench,
  Store,
  MessageSquare,
  Briefcase,
} from "lucide-react";
import { useLocationStore } from "@/lib/location/store";
import { session } from "@/lib/auth/session";
import { useSessionUser } from "@/lib/auth/useSessionUser";
import { api } from "@/lib/api/endpoints";
import { LoginModal } from "@/components/auth/LoginModal";
import { LocationModal } from "@/components/location/LocationModal";
import { useCart, useCategories } from "@/lib/queries/hooks";
import { queryKeys } from "@/lib/queries/keys";
import { SearchResult } from "@/types";
import { highlightQuery, searchResultHref, searchResultLabel } from "@/lib/search/routes";

export function Header() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { cityName, openModal: openLocationModal } = useLocationStore();
  const user = useSessionUser();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const categoryRef = useRef<HTMLDivElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);

  const { data: categories = [] } = useCategories();
  const { data: cart } = useCart();
  const cartCount = cart?.total_items || cart?.items?.length || 0;

  useEffect(() => {
    const invalidateQueries = () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cart });
      queryClient.invalidateQueries({ queryKey: queryKeys.me });
    };

    const openLogin = () => setIsLoginModalOpen(true);

    window.addEventListener("paykop_auth_change", invalidateQueries);
    window.addEventListener("paykop_open_login", openLogin);
    window.addEventListener("paykop_cart_change", invalidateQueries);

    return () => {
      window.removeEventListener("paykop_auth_change", invalidateQueries);
      window.removeEventListener("paykop_open_login", openLogin);
      window.removeEventListener("paykop_cart_change", invalidateQueries);
    };
  }, [queryClient]);

  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 1) return;

    const timer = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await api.search.query({ q, limit: 8 });
        setSearchResults(res.results || []);
      } catch {
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const showAutocomplete = showSuggestions && searchQuery.trim().length >= 1;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
      if (categoryRef.current && !categoryRef.current.contains(e.target as Node)) {
        setIsCategoryOpen(false);
      }
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) {
        setIsAccountMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setShowSuggestions(false);
    router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
  };

  const handleLogout = async () => {
    const refreshToken = session.getRefreshToken();
    if (refreshToken) {
      try {
        await api.auth.logout(refreshToken);
      } catch {
        // still clear locally
      }
    }
    session.clearSession();
    queryClient.removeQueries({ queryKey: queryKeys.cart });
    setIsAccountMenuOpen(false);
    router.push("/");
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white border-b border-slate-100 shadow-xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20 gap-2 sm:gap-4 lg:gap-8 min-w-0">
            <div className="flex items-center gap-3 sm:gap-6 shrink-0 min-w-0">
              <Link href="/" className="flex items-center gap-2 min-w-0">
                <Image
                  src="/brand/paykop-icon.png"
                  alt="Paykop"
                  width={40}
                  height={40}
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl shadow-md shrink-0"
                  priority
                />
                <div className="flex flex-col min-w-0">
                  <span className="text-xl sm:text-2xl font-black text-[var(--primary)] tracking-tight leading-none">
                    Paykop<span className="text-[var(--accent-green)]">.</span>
                  </span>
                  <span className="hidden sm:block text-[10px] text-slate-400 font-semibold uppercase tracking-widest leading-none mt-0.5">
                    Hyperlocal Market
                  </span>
                </div>
              </Link>

              <div className="relative hidden xl:block" ref={categoryRef}>
                <button
                  onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-full shopcart-pill text-sm font-semibold cursor-pointer"
                >
                  <Layers className="w-4 h-4" />
                  <span>Categories</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isCategoryOpen ? "rotate-180" : ""}`} />
                </button>

                {isCategoryOpen && (
                  <div className="absolute left-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-fade-in">
                    <div className="px-4 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Departments
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {categories.length === 0 ? (
                        <p className="px-4 py-3 text-sm text-slate-500">No categories yet</p>
                      ) : (
                        categories.map((cat) => (
                          <Link
                            key={cat.id}
                            href={`/categories/${cat.id}`}
                            onClick={() => setIsCategoryOpen(false)}
                            className="flex items-center justify-between px-4 py-2.5 text-sm text-slate-700 hover:bg-[var(--primary-subtle)] hover:text-[var(--primary)]"
                          >
                            <span>{cat.name}</span>
                          </Link>
                        ))
                      )}
                      <Link
                        href="/categories"
                        onClick={() => setIsCategoryOpen(false)}
                        className="block px-4 py-2.5 text-sm font-bold text-[var(--primary)]"
                      >
                        View all categories
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1 min-w-0 max-w-2xl relative" ref={searchRef} data-tour="search-input">
              <form onSubmit={handleSearchSubmit} className="relative">
                <input
                  type="text"
                  placeholder="Search products, services, donations…"
                  value={searchQuery}
                  onChange={(e) => {
                    const value = e.target.value;
                    setSearchQuery(value);
                    setShowSuggestions(true);
                    if (!value.trim()) setSearchResults([]);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  className="w-full min-w-0 pl-3 sm:pl-5 pr-10 sm:pr-12 py-2 sm:py-3 bg-[var(--surface-muted)] border border-transparent rounded-full text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--primary)]/10"
                />
                <button
                  type="submit"
                  className="absolute right-1.5 sm:right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[var(--primary)] text-white flex items-center justify-center cursor-pointer"
                >
                  <Search className="w-4 h-4" />
                </button>
              </form>

              {showAutocomplete && (searchLoading || searchResults.length > 0) && (
                <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50">
                  {searchLoading && (
                    <p className="px-4 py-3 text-xs text-slate-400">Searching…</p>
                  )}
                  {!searchLoading &&
                    searchResults.map((item) => {
                      const parts = highlightQuery(item.title, searchQuery.trim());
                      return (
                        <button
                          key={`${item.type}-${item.id}`}
                          type="button"
                          onClick={() => {
                            setShowSuggestions(false);
                            router.push(searchResultHref(item));
                          }}
                          className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-[var(--primary-subtle)] flex items-start gap-2.5 cursor-pointer"
                        >
                          <Search className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                          <div className="min-w-0">
                            <span className="font-semibold text-slate-900">
                              {parts.before}
                              {parts.match && (
                                <mark className="bg-amber-100 text-inherit rounded px-0.5">
                                  {parts.match}
                                </mark>
                              )}
                              {parts.after}
                            </span>
                            <span className="block text-[10px] text-slate-400 mt-0.5">
                              {searchResultLabel(item.type)} · {item.subtitle}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                </div>
              )}
            </div>

            <div className="flex items-center gap-1.5 sm:gap-4 shrink-0">
              <button
                onClick={openLocationModal}
                data-tour="location-selector"
                className="hidden md:flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-slate-200 text-xs font-medium text-slate-700 hover:border-[var(--primary)] cursor-pointer"
              >
                <MapPin className="w-3.5 h-3.5 text-[var(--primary-light)]" />
                <span className="max-w-[110px] truncate">{cityName}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              <Link href="/chat" className="hidden lg:flex p-2 rounded-full hover:bg-slate-100" title="Chat">
                <MessageSquare className="w-5 h-5 text-[var(--primary)]" />
              </Link>

              <Link
                href="/cart"
                data-tour="cart-button"
                className="relative flex items-center gap-2 px-2.5 sm:px-3.5 py-2 rounded-full bg-[var(--surface-muted)] hover:bg-[var(--primary-subtle)]"
              >
                <ShoppingCart className="w-5 h-5 text-[var(--primary)]" />
                <span className="hidden sm:inline text-xs font-bold">Cart</span>
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-[var(--accent-green)] text-slate-900 font-black text-[11px] flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Link>

              {user ? (
                <div className="relative" ref={accountRef}>
                  <button
                    onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)}
                    className="flex items-center gap-2 p-1.5 sm:pl-3 rounded-full border border-slate-200 cursor-pointer"
                  >
                    <span className="hidden sm:inline text-xs font-semibold text-slate-800 max-w-[90px] truncate">
                      {user.first_name || "Account"}
                    </span>
                    <div className="w-7 h-7 rounded-full bg-[var(--primary)] text-white flex items-center justify-center text-xs font-bold uppercase">
                      {user.first_name ? user.first_name[0] : <UserIcon className="w-4 h-4" />}
                    </div>
                  </button>

                  {isAccountMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50">
                      <Link href="/account" onClick={() => setIsAccountMenuOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm">
                        <UserIcon className="w-4 h-4" /> Profile
                      </Link>
                      <Link href="/account/orders" onClick={() => setIsAccountMenuOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm">
                        <Package className="w-4 h-4" /> Orders
                      </Link>
                      <Link href="/bookings" onClick={() => setIsAccountMenuOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm">
                        <Wrench className="w-4 h-4" /> Bookings
                      </Link>
                      <Link href="/account/wishlist" onClick={() => setIsAccountMenuOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm">
                        <Heart className="w-4 h-4" /> Wishlist
                      </Link>
                      <Link href="/account/addresses" onClick={() => setIsAccountMenuOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm">
                        <MapPin className="w-4 h-4" /> Addresses
                      </Link>
                      <Link href="/seller" onClick={() => setIsAccountMenuOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm">
                        <Store className="w-4 h-4" /> {user.role === "seller" ? "Seller hub" : "Become a seller"}
                      </Link>
                      {user.role === "agent" && (
                        <Link href="/agent" onClick={() => setIsAccountMenuOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm">
                          <Briefcase className="w-4 h-4" /> Agent hub
                        </Link>
                      )}
                      <button onClick={handleLogout} className="w-full text-left flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 cursor-pointer">
                        <LogOut className="w-4 h-4" /> Sign out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => setIsLoginModalOpen(true)}
                  className="px-2.5 sm:px-4 py-2 rounded-full shopcart-btn-primary text-xs font-semibold cursor-pointer flex items-center justify-center min-w-[36px] min-h-[36px] sm:min-w-0"
                  aria-label="Sign in"
                >
                  <UserIcon className="w-4 h-4 sm:hidden" />
                  <span className="hidden sm:inline">Sign In</span>
                </button>
              )}

              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 rounded-lg text-slate-700"
                aria-label="Open menu"
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          <nav className="hidden lg:flex items-center gap-6 py-2.5 border-t border-slate-100 text-xs font-semibold text-slate-700">
            <Link href="/" className="text-[var(--primary)] font-bold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-[var(--accent-green)]" /> Shop
            </Link>
            <Link href="/categories" className="hover:text-[var(--primary)]">Categories</Link>
            <Link href="/services" className="hover:text-[var(--primary)] flex items-center gap-1">
              <Wrench className="w-3.5 h-3.5" /> Services
            </Link>
            <Link href="/donations" className="hover:text-[var(--primary)] flex items-center gap-1">
              <HandHeart className="w-3.5 h-3.5" /> Donations
            </Link>
            <Link href="/blood" className="hover:text-[var(--primary)] flex items-center gap-1">
              <Droplet className="w-3.5 h-3.5 text-red-600" /> Blood
            </Link>
            <Link href="/seller" className="hover:text-[var(--primary)] flex items-center gap-1">
              <Store className="w-3.5 h-3.5" /> Sell
            </Link>
            {user?.role === "agent" && (
              <Link href="/agent" className="hover:text-[var(--primary)] flex items-center gap-1">
                <Briefcase className="w-3.5 h-3.5" /> Agent
              </Link>
            )}
          </nav>
        </div>

        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-200 bg-white p-4 grid grid-cols-2 gap-2 text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setIsMobileMenuOpen(false);
                openLocationModal();
              }}
              className="p-2.5 rounded-xl bg-slate-50 text-left flex items-center gap-2 col-span-2"
            >
              <MapPin className="w-3.5 h-3.5 text-[var(--primary)]" />
              Location: {cityName}
            </button>
            <Link href="/chat" onClick={() => setIsMobileMenuOpen(false)} className="p-2.5 rounded-xl bg-slate-50 flex items-center gap-2">
              <MessageSquare className="w-3.5 h-3.5" /> Chat
            </Link>
            <Link href="/" onClick={() => setIsMobileMenuOpen(false)} className="p-2.5 rounded-xl bg-slate-50 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-[var(--accent-green)]" /> Shop
            </Link>
            <Link href="/categories" onClick={() => setIsMobileMenuOpen(false)} className="p-2.5 rounded-xl bg-slate-50">Categories</Link>
            <Link href="/services" onClick={() => setIsMobileMenuOpen(false)} className="p-2.5 rounded-xl bg-slate-50">Services</Link>
            <Link href="/donations" onClick={() => setIsMobileMenuOpen(false)} className="p-2.5 rounded-xl bg-slate-50">Donations</Link>
            <Link href="/blood" onClick={() => setIsMobileMenuOpen(false)} className="p-2.5 rounded-xl bg-slate-50">Blood</Link>
            <Link href="/seller" onClick={() => setIsMobileMenuOpen(false)} className="p-2.5 rounded-xl bg-slate-50">Sell</Link>
            {user?.role === "agent" && (
              <Link href="/agent" onClick={() => setIsMobileMenuOpen(false)} className="p-2.5 rounded-xl bg-slate-50">Agent hub</Link>
            )}
            {!user && (
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setIsLoginModalOpen(true);
                }}
                className="p-2.5 rounded-xl bg-[var(--primary)] text-white flex items-center gap-2 col-span-2 cursor-pointer"
              >
                <UserIcon className="w-3.5 h-3.5" /> Sign In
              </button>
            )}
          </div>
        )}
      </header>

      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
      <LocationModal />
    </>
  );
}
