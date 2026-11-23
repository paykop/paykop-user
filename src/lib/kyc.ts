/** Self-serve sellers must be KYC verified to list products/services. */

export function isKycVerified(status?: string | null): boolean {
  return (status || "").toLowerCase() === "verified";
}

export function kycStatusLabel(status?: string | null): string {
  const s = (status || "unverified").toLowerCase();
  if (s === "verified") return "Verified";
  if (s === "pending") return "Pending";
  return "Unverified";
}

export function kycStatusChipClass(status?: string | null): string {
  const s = (status || "unverified").toLowerCase();
  if (s === "verified") return "bg-emerald-50 text-emerald-700";
  if (s === "pending") return "bg-amber-50 text-amber-800";
  return "bg-gray-100 text-gray-600";
}

export const KYC_REQUIRED_LISTING_MSG =
  "Complete KYC verification before listing products. Contact support or finish KYC in the seller app.";

export function isKycBlockedError(message?: string): boolean {
  if (!message) return false;
  const m = message.toLowerCase();
  return m.includes("kyc") || m.includes("seller ready") || m.includes("not verified");
}
