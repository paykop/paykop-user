export const queryKeys = {
  home: (lat?: number, lng?: number) => ["home", lat, lng] as const,
  nearbyProducts: (lat?: number, lng?: number, radius?: number, categoryId?: number) =>
    ["nearby-products", lat, lng, radius, categoryId] as const,
  categories: ["categories"] as const,
  cart: ["cart"] as const,
  me: ["me"] as const,
};
