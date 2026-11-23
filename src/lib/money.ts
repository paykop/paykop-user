/**
 * Utility functions for handling Indian Rupee (INR) currency and paise conversions.
 * Backend prices are strictly stored and returned in paise (1 INR = 100 paise).
 */

export function paiseToRupees(paise: number): number {
  if (isNaN(paise) || paise == null) return 0;
  return paise / 100;
}

export function rupeesToPaise(rupees: number): number {
  if (isNaN(rupees) || rupees == null) return 0;
  return Math.round(rupees * 100);
}

export function formatPaise(
  paise: number,
  options?: {
    showDecimals?: boolean;
    compact?: boolean;
  }
): string {
  if (paise == null || isNaN(paise)) return "₹0";

  const rupees = paiseToRupees(paise);

  if (options?.compact && rupees >= 100000) {
    // Format Lakhs / Crores if compact
    if (rupees >= 10000000) {
      return `₹${(rupees / 10000000).toFixed(1)} Cr`;
    }
    return `₹${(rupees / 100000).toFixed(1)} L`;
  }

  const fractionDigits = options?.showDecimals ? 2 : rupees % 1 === 0 ? 0 : 2;

  const formatted = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: 2,
  }).format(rupees);

  return formatted;
}

export function calculateDiscountPercentage(
  originalPricePaise: number,
  discountedPricePaise: number
): number {
  if (!originalPricePaise || originalPricePaise <= discountedPricePaise) return 0;
  const diff = originalPricePaise - discountedPricePaise;
  return Math.round((diff / originalPricePaise) * 100);
}
