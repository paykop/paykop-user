"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MediaThumb } from "@/components/ui/MediaThumb";
import {
  Wrench,
  Star,
  ChevronRight,
  Loader2,
  Calendar,
  Search,
} from "lucide-react";
import { api } from "@/lib/api/endpoints";
import { useLocationStore } from "@/lib/location/store";
import { ServiceItem } from "@/types";
import { formatPaise } from "@/lib/money";

export default function ServicesPage() {
  const { latitude, longitude, cityName } = useLocationStore();
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    api.services
      .list({
        lat: latitude || undefined,
        lng: longitude || undefined,
        radius: 25,
      })
      .then((data) => {
        setServices(Array.isArray(data) ? data : []);
      })
      .catch(() => setServices([]))
      .finally(() => setLoading(false));
  }, [latitude, longitude]);

  const filtered = services.filter(
    (s) =>
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.category?.name && s.category.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-gray-500">
        <Link href="/" className="hover:text-gray-900">
          Home
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="font-semibold text-gray-900">Local Services</span>
      </nav>

      {/* Hero Banner */}
      <div className="rounded-3xl bg-[var(--primary)] text-white p-8 sm:p-10 relative overflow-hidden shadow-md">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--accent-green)]/20 text-[var(--accent-green)] text-xs font-bold">
            <Wrench className="w-3.5 h-3.5" />
            <span>Hyperlocal Verified Pros</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
            Book Trusted Neighborhood Services
          </h1>
          <p className="text-sm text-white/80">
            From AC repair and plumbing to home cleaning and beauty services in {cityName}.
          </p>

          {/* Search bar */}
          <div className="pt-2 max-w-md">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search services (plumber, electrician, etc.)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white rounded-2xl text-xs text-gray-900 focus:outline-none shadow-md font-medium"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Services Grid */}
      {loading ? (
        <div className="py-20 text-center">
          <Loader2 className="w-8 h-8 text-[var(--primary)] animate-spin mx-auto" />
          <p className="text-xs text-gray-500 mt-2">Loading local services in {cityName}...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="shopcart-card p-12 text-center bg-white space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-gray-100 text-gray-400 flex items-center justify-center mx-auto">
            <Wrench className="w-8 h-8" />
          </div>
          <h3 className="font-bold text-lg text-gray-900">No services available nearby</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            We are actively enrolling licensed service professionals in your area. Try searching for a different service.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((service) => {
            const img =
              service.image ||
              (service.images && service.images.length > 0 ? service.images[0] : null) ||
              null;

            return (
              <div
                key={service.id}
                className="shopcart-card p-5 bg-white flex flex-col justify-between space-y-4 hover:border-[var(--primary)] transition-all group"
              >
                <div className="space-y-3">
                  <div className="h-44 rounded-2xl overflow-hidden relative bg-gray-50">
                    <MediaThumb
                      src={img}
                      alt={service.title}
                      className="object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                      <span className="font-bold uppercase tracking-wider text-[var(--primary)] text-[10px]">
                        {service.category?.name || "Home Service"}
                      </span>
                      <div className="flex items-center gap-1 font-semibold text-gray-700">
                        <Star className="w-3.5 h-3.5 fill-[#ffc220] text-[#ffc220]" />
                        <span>{(service.avg_rating || service.rating || 4.9).toFixed(1)}</span>
                        <span className="text-gray-400 text-[10px]">
                          ({service.review_count || 0})
                        </span>
                      </div>
                    </div>

                    <h3 className="font-bold text-base text-gray-900 group-hover:text-[var(--primary)] transition-colors line-clamp-1">
                      {service.title}
                    </h3>
                    <p className="text-xs text-gray-500 line-clamp-2 mt-1">
                      {service.description}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-gray-400">Consultation / Base Fee</div>
                    <div className="text-base font-black text-gray-900">
                      {formatPaise(service.fees)}
                    </div>
                  </div>

                  <Link
                    href={`/services/${service.id}`}
                    className="px-4 py-2 rounded-xl shopcart-btn-primary text-xs font-bold flex items-center gap-1.5 shadow-sm"
                  >
                    <Calendar className="w-3.5 h-3.5 text-[var(--accent-green)]" />
                    <span>Book Service</span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
