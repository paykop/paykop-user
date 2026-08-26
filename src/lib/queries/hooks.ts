"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/endpoints";
import { session } from "@/lib/auth/session";
import { parseProductImages } from "@/lib/media";
import { Product } from "@/types";
import { queryKeys } from "./keys";
import { mapHomeFeed } from "@/lib/home/mapFeed";

function mapNearbyProduct(product: Product): Product {
  return {
    ...product,
    images: parseProductImages(product),
  };
}

export function useHomeFeed(latitude?: number, longitude?: number) {
  return useQuery({
    queryKey: queryKeys.home(latitude, longitude),
    queryFn: async () => {
      const raw = await api.home.getFeed({
        latitude: latitude || undefined,
        longitude: longitude || undefined,
        radius: 15,
      });
      return mapHomeFeed(raw);
    },
  });
}

export function useNearbyProducts(opts: {
  latitude?: number | null;
  longitude?: number | null;
  radius?: number;
  limit?: number;
  categoryId?: number;
}) {
  const lat = opts.latitude ?? undefined;
  const lng = opts.longitude ?? undefined;
  const radius = opts.radius ?? 15;
  const hasLocation = typeof lat === "number" && typeof lng === "number";

  return useQuery({
    queryKey: queryKeys.nearbyProducts(lat, lng, radius, opts.categoryId),
    enabled: hasLocation,
    queryFn: async () => {
      const data = await api.products.list({
        lat,
        lng,
        radius,
        limit: opts.limit ?? 8,
        category_id: opts.categoryId,
      });
      return (data.products || [])
        .map(mapNearbyProduct)
        .filter((product) => typeof product.distance_km === "number");
    },
  });
}

export function useCategories() {
  return useQuery({
    queryKey: queryKeys.categories,
    queryFn: async () => {
      const data = await api.categories.getAll();
      return Array.isArray(data) ? data : [];
    },
  });
}

export function useCart() {
  return useQuery({
    queryKey: queryKeys.cart,
    enabled: session.isAuthenticated(),
    queryFn: () => api.cart.get(),
  });
}

export function useMe() {
  return useQuery({
    queryKey: queryKeys.me,
    enabled: session.isAuthenticated(),
    queryFn: () => api.auth.getMe(),
  });
}
