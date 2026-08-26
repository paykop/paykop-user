"use client";

import Link from "next/link";
import { Layers } from "lucide-react";
import { useCategories } from "@/lib/queries/hooks";
import { Container } from "@/components/ui/Container";
import { EmptyState } from "@/components/ui/EmptyState";
import { MediaThumb } from "@/components/ui/MediaThumb";
import { firstImage } from "@/lib/media";

export default function CategoriesIndexPage() {
  const { data: categories = [], isLoading } = useCategories();

  return (
    <div className="py-10 pb-20">
      <Container>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-6">All categories</h1>
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="shopcart-card h-40 animate-pulse bg-slate-100" />
            ))}
          </div>
        ) : categories.length === 0 ? (
          <EmptyState icon={<Layers className="w-7 h-7" />} title="No categories yet" description="Categories appear here when the catalog is published." />
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
