"use client";

import Link from "next/link";
import { ArrowRight, MapPin, ShieldCheck, Truck, Wrench, HandHeart, Droplet } from "lucide-react";
import { useLocationStore } from "@/lib/location/store";
import { useHomeFeed, useNearbyProducts } from "@/lib/queries/hooks";
import { ProductCard } from "@/components/product/ProductCard";
import { formatPaise } from "@/lib/money";
import { Container } from "@/components/ui/Container";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { SkeletonGrid } from "@/components/ui/SkeletonGrid";
import { MediaThumb } from "@/components/ui/MediaThumb";
import { ShelfBlank, padToMinSlots } from "@/components/ui/ShelfBlank";
import { useTour } from "@/lib/tours/useTour";

function bannerHref(banner: { type?: string; link_type?: string; link_id?: string; link_url?: string }) {
  if (banner.link_url) return banner.link_url;
  const kind = banner.type || banner.link_type;
  if (!kind || !banner.link_id) return "/categories";
  if (kind === "product") return `/products/${banner.link_id}`;
  if (kind === "service") return `/services/${banner.link_id}`;
  if (kind === "donation") return `/donations/${banner.link_id}`;
  return "/categories";
}

export default function HomePage() {
  const { latitude, longitude, cityName, openModal: openLocationModal } = useLocationStore();
  const { data: feed } = useHomeFeed(latitude || undefined, longitude || undefined);
  const { data: nearbyProducts = [], isLoading: nearbyProductsLoading } = useNearbyProducts({
    latitude,
    longitude,
    radius: 15,
    limit: 8,
  });

  useTour("buyer_home", { autoStart: true, delayMs: 1200 });

  const heroBanner = feed?.banners?.[0];
  const extraBanners = feed?.banners?.slice(1) || [];
  const productSlots = padToMinSlots(nearbyProducts, 4);
  const serviceSlots = padToMinSlots(feed?.nearbyServices ?? [], 4);

  return (
    <div className="space-y-12 pb-20">
      <section className="relative overflow-hidden bg-[var(--primary)] text-white pt-10 pb-16 lg:py-20 rounded-b-3xl">
        <Container className="relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 text-[var(--accent-green)] text-xs font-bold">
                Marketplace in {cityName}
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1]">
                Shopping and<br />
                <span className="text-[var(--accent-green)]">department store.</span>
              </h1>
              <p className="text-base sm:text-lg text-white/80 max-w-xl">
                {feed?.locationMessage ||
                  "Shop neighborhood stores, book local services, and support community causes near you."}
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link
                  href="/categories"
                  className="px-6 py-3.5 rounded-full bg-[var(--accent-green)] text-slate-900 font-bold text-sm flex items-center gap-2"
                >
                  Explore shop <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/services"
                  className="px-6 py-3.5 rounded-full bg-white/10 border border-white/20 font-semibold text-sm flex items-center gap-2"
                >
                  <Wrench className="w-4 h-4" /> Book services
                </Link>
                <button onClick={openLocationModal} className="px-4 py-3.5 text-xs text-white/80 flex items-center gap-1.5 cursor-pointer">
                  <MapPin className="w-4 h-4 text-[var(--accent-yellow)]" />
                  {cityName}
                </button>
              </div>
            </div>

            <div className="lg:col-span-5">
              {heroBanner ? (
                <Link href={bannerHref(heroBanner)} className="block relative rounded-3xl overflow-hidden border border-white/15 h-64">
                  <MediaThumb src={heroBanner.image_url} alt={heroBanner.title} className="object-cover" />
                  <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/70 text-sm font-bold">
                    {heroBanner.title}
                  </div>
                </Link>
              ) : (
                <div className="rounded-3xl border border-white/15 p-6 bg-[var(--primary-dark)] space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <ShieldCheck className="w-4 h-4 text-[var(--accent-green)]" /> Verified sellers
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Truck className="w-4 h-4 text-[var(--accent-green)]" /> Local delivery with OTP handover
                  </div>
                </div>
              )}
            </div>
          </div>
        </Container>
      </section>

      {feed && feed.productCategories.length > 0 && (
        <section data-tour="categories-shelf">
          <Container>
            <SectionHeader title="Shop our top categories" subtitle={`Departments near ${cityName}`} href="/categories" />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              {feed.productCategories.map((cat) => (
                <Link key={cat.id} href={`/categories/${cat.id}`} className="shopcart-card p-4 flex flex-col items-center text-center space-y-3">
                  <div className="w-20 h-20 rounded-2xl bg-[var(--surface-muted)] overflow-hidden relative">
                    <MediaThumb src={cat.image} alt={cat.title} className="object-cover" />
                  </div>
                  <span className="text-xs font-bold text-slate-800 line-clamp-1">{cat.title}</span>
                </Link>
              ))}
            </div>
          </Container>
        </section>
      )}

      <section>
        <Container>
          <SectionHeader
            title="Today's best deals for you"
            subtitle={`Items available near ${cityName}`}
            href="/products"
            actionLabel="View all"
          />
          {nearbyProductsLoading ? (
            <SkeletonGrid />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {productSlots.map(({ item, key }) =>
                item ? (
                  <ProductCard key={key} product={item} />
                ) : (
                  <ShelfBlank key={key} className="h-72" />
                )
              )}
            </div>
          )}
        </Container>
      </section>

      {extraBanners.length > 0 && (
        <section>
          <Container>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {extraBanners.map((banner) => (
                <Link key={banner.id} href={bannerHref(banner)} className="relative h-40 rounded-3xl overflow-hidden shopcart-card">
                  <MediaThumb src={banner.image_url} alt={banner.title} className="object-cover" />
                  <div className="absolute inset-0 bg-black/35 p-5 flex items-end text-white font-black">{banner.title}</div>
                </Link>
              ))}
            </div>
          </Container>
        </section>
      )}

      {feed && feed.serviceCategories.length > 0 && (
        <section>
          <Container>
            <div className="rounded-3xl bg-[var(--surface-muted)] p-6 sm:p-8">
              <SectionHeader title="Services to help you shop" subtitle="Book verified neighborhood professionals" href="/services" />
              <div className="flex flex-wrap gap-2 mb-6">
                {feed.serviceCategories.map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/services?category_id=${cat.id}`}
                    className="px-4 py-2 rounded-full bg-white text-xs font-bold text-slate-800 border border-slate-200"
                  >
                    {cat.title}
                  </Link>
                ))}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {serviceSlots.map(({ item, key }) =>
                  item ? (
                    <Link key={key} href={`/services/${item.id}`} className="shopcart-card p-4 bg-white">
                      <div className="relative h-28 rounded-xl overflow-hidden bg-[var(--primary-subtle)] mb-3">
                        <MediaThumb src={item.image} alt={item.title} className="object-cover" />
                      </div>
                      <h3 className="font-bold text-sm line-clamp-1">{item.title}</h3>
                      <p className="text-xs text-slate-500">{item.subtitle}</p>
                      <p className="text-sm font-black text-[var(--primary)] mt-2">{formatPaise(item.price)}</p>
                    </Link>
                  ) : (
                    <ShelfBlank key={key} className="h-44 bg-white/60" />
                  )
                )}
              </div>
            </div>
          </Container>
        </section>
      )}

      {(feed?.donations?.length || feed?.bloodRequests?.length) ? (
        <section>
          <Container>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link href="/donations" className="shopcart-card p-6 flex gap-4 items-start">
                <HandHeart className="w-8 h-8 text-[var(--primary)]" />
                <div>
                  <h3 className="font-black text-lg">Community donations</h3>
                  <p className="text-sm text-slate-500">
                    {feed?.donations?.length ? `${feed.donations.length} active campaigns` : "Support local causes"}
                  </p>
                </div>
              </Link>
              <Link href="/blood" className="shopcart-card p-6 flex gap-4 items-start">
                <Droplet className="w-8 h-8 text-red-600" />
                <div>
                  <h3 className="font-black text-lg">Blood requests</h3>
                  <p className="text-sm text-slate-500">
                    {feed?.bloodRequests?.length ? `${feed.bloodRequests.length} open requests` : "Help nearby patients"}
                  </p>
                </div>
              </Link>
            </div>
          </Container>
        </section>
      ) : null}
    </div>
  );
}
