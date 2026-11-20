import { api } from "@/lib/api/endpoints";
import { session } from "@/lib/auth/session";

const AGRI_KEYWORDS = new Set([
  "farm",
  "farmer",
  "farmers",
  "farming",
  "agriculture",
  "agri",
  "crop",
  "crops",
  "harvest",
  "produce",
  "vegetable",
  "vegetables",
  "veggie",
  "veggies",
  "fruit",
  "fruits",
  "grain",
  "grains",
  "pulse",
  "pulses",
  "seed",
  "seeds",
  "paddy",
  "wheat",
  "rice",
  "tomato",
  "tomatoes",
  "potato",
  "potatoes",
  "onion",
  "onions",
  "organic",
  "fertilizer",
  "manure",
  "dairy",
  "fpo",
]);

/**
 * Returns true if the query mentions farm / agricultural terms.
 */
export function isAgriSearchQuery(query?: string | null): boolean {
  if (!query) return false;
  const words = query
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
  return words.some((w) => AGRI_KEYWORDS.has(w));
}

/**
 * Checks if a product or category belongs to the isolated Farm vertical.
 */
export function isFarmVertical(entity?: { vertical?: string } | null): boolean {
  return entity?.vertical === "farm";
}

export interface FarmModalDetail {
  deepLink?: string;
  productId?: number | string;
  handoffCode?: string;
}

export function openFarmModal(detail?: FarmModalDetail) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("paykop_open_farm_modal", { detail }));
  }
}

/**
 * Launches the Paykop Farm application.
 * Performs a 60-second single-use SSO handoff exchange if authenticated,
 * then deep-links to `paykopfarm://` with web/modal fallback.
 */
export async function launchFarmApp(options?: {
  productId?: number | string;
  fallbackToModal?: boolean;
}) {
  let handoffCode: string | undefined;

  if (session.isAuthenticated()) {
    try {
      const res = await api.auth.createHandoff("farm");
      handoffCode = res?.code;
    } catch {
      // Graceful fallback to standard scheme without token
    }
  }

  let deepLink = "paykopfarm://";
  if (handoffCode) {
    deepLink = `paykopfarm://auth?code=${encodeURIComponent(handoffCode)}${
      options?.productId ? `&productId=${options.productId}` : ""
    }`;
  } else if (options?.productId) {
    deepLink = `paykopfarm://product/${options.productId}`;
  }

  if (typeof window !== "undefined") {
    // Attempt deep linking
    try {
      window.location.href = deepLink;
    } catch {
      // ignored
    }

    // Always provide modal feedback on web / desktop if requested or after timeout
    if (options?.fallbackToModal !== false) {
      setTimeout(() => {
        openFarmModal({
          deepLink,
          productId: options?.productId,
          handoffCode,
        });
      }, 350);
    }
  }

  return { deepLink, handoffCode };
}
