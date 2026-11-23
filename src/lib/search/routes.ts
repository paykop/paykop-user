import { SearchResult, SearchResultType } from "@/types";

const TYPE_LABELS: Record<SearchResultType, string> = {
  product: "Product",
  service: "Service",
  donation_campaign: "Donation",
  blood_request: "Blood request",
  blood_donor: "Blood donor",
  user: "User",
};

export function searchResultLabel(type: SearchResultType): string {
  return TYPE_LABELS[type] ?? type;
}

/** Map federated search result to a storefront route. */
export function searchResultHref(result: SearchResult): string {
  const id = result.id;
  switch (result.type) {
    case "product":
      return `/products/${id}`;
    case "service":
      return `/services/${id}`;
    case "donation_campaign":
      return `/donations/${id}`;
    case "blood_request":
      return `/blood?request_id=${id}`;
    case "blood_donor":
      return `/blood`;
    case "user":
      return `/search?q=${encodeURIComponent(result.title)}&type=user`;
    default:
      return `/search?q=${encodeURIComponent(result.title)}`;
  }
}

/** Map search tab to API type filter. */
export function searchTabToApiType(
  tab: "all" | "products" | "services" | "donations" | "blood" | "users"
): string | undefined {
  switch (tab) {
    case "products":
      return "product";
    case "services":
      return "service";
    case "donations":
      return "donation";
    case "users":
      return "user";
    case "blood":
      return undefined; // blood types are mixed in donation search
    default:
      return undefined;
  }
}

export function highlightQuery(text: string, query: string): { before: string; match: string; after: string } {
  if (!query.trim()) return { before: text, match: "", after: "" };
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx < 0) return { before: text, match: "", after: "" };
  return {
    before: text.slice(0, idx),
    match: text.slice(idx, idx + query.length),
    after: text.slice(idx + query.length),
  };
}
