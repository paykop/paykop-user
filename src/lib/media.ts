export function firstImage(
  ...candidates: Array<string | string[] | null | undefined>
): string | null {
  for (const value of candidates) {
    if (Array.isArray(value)) {
      const hit = value.find((item) => typeof item === "string" && item.trim());
      if (hit) return hit;
    } else if (typeof value === "string" && value.trim()) {
      return value;
    }
  }
  return null;
}

export function parseProductImages(product: {
  images?: string[] | string;
  image?: string;
  images_json?: string;
}): string[] {
  if (Array.isArray(product.images)) {
    return product.images.filter(Boolean);
  }
  if (typeof product.images === "string" && product.images.trim()) {
    try {
      const parsed = JSON.parse(product.images);
      if (Array.isArray(parsed)) return parsed.filter(Boolean);
    } catch {
      return [product.images];
    }
  }
  if (product.image) return [product.image];
  if (product.images_json) {
    try {
      const parsed = JSON.parse(product.images_json);
      if (Array.isArray(parsed)) return parsed.filter(Boolean);
    } catch {
      return [];
    }
  }
  return [];
}
