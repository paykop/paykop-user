"use client";

import Link from "next/link";
import { Layers, Sprout, ArrowRight } from "lucide-react";
import { useCategories } from "@/lib/queries/hooks";
import { Container } from "@/components/ui/Container";
import { EmptyState } from "@/components/ui/EmptyState";
import { MediaThumb } from "@/components/ui/MediaThumb";
import { firstImage } from "@/lib/media";
import { openFarmModal } from "@/lib/farm/launch";

export default function CategoriesIndexPage() {
  // Scoped to Paykop retail departments to maintain clean domain isolation
  const { data: categories = [], isLoading } = useCategories("paykop");

  return (
    <div className="py-10 pb-20">
      <Container>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">All Categories</h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Browse Paykop storefront departments for retail, electronics, fashion, and home supplies.
            </p>
          </div>
        </div>

        {/* Paykop Farm Agricultural Produce Section */}
        <div className="mb-10 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-emerald-50 via-teal-50 to-green-50 border border-emerald-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider">
              <Sprout className="w-3.5 h-3.5 text-emerald-600" />
              <span>Dedicated Agricultural Vertical</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Looking for Farm Produce, Crops &amp; Vegetables?
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              All agricultural produce, fresh harvest, seeds, and grains are served through our separate <strong>Paykop Farm</strong> app for weight-based metric measurement and direct farmer sourcing.
            </p>
          </div>
          <button
            type="button"
            onClick={() => openFarmModal()}
            className="px-6 py-3.5 rounded-full bg-[#1B5E20] hover:bg-[#2E7D32] text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-md transition-all cursor-pointer shrink-0"
          >
            <span>Explore Paykop Farm App</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="shopcart-card h-40 animate-pulse bg-slate-100" />
            ))}
          </div>
        ) : categories.length === 0 ? (
          <EmptyState
            icon={<Layers className="w-7 h-7" />}
            title="No categories yet"
            description="Categories appear here when the catalog is published."
          />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {categories.map((cat) => (
              <Link key={cat.id} href={`/categories/${cat.id}`} className="shopcart-card p-4 space-y-3">
                <div className="relative h-28 rounded-xl overflow-hidden bg-[var(--primary-subtle)]">
                  <MediaThumb src={firstImage(cat.image_url)} alt={cat.name} className="object-cover" />
                </div>
                <h2 className="font-bold text-sm">{cat.name}</h2>
              </Link>
            ))}
          </div>
        )}
      </Container>
    </div>
  );
}
