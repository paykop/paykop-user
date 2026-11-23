import { describe, expect, it } from "vitest";
import {
  isKycVerified,
  kycStatusLabel,
  kycStatusChipClass,
  isKycBlockedError,
} from "@/lib/kyc";

describe("kyc", () => {
  it("detects verified status", () => {
    expect(isKycVerified("verified")).toBe(true);
    expect(isKycVerified("Verified")).toBe(true);
    expect(isKycVerified("pending")).toBe(false);
  });

  it("returns status labels", () => {
    expect(kycStatusLabel("verified")).toBe("Verified");
    expect(kycStatusLabel("pending")).toBe("Pending");
    expect(kycStatusLabel(null)).toBe("Unverified");
  });

  it("returns chip classes", () => {
    expect(kycStatusChipClass("verified")).toContain("emerald");
    expect(kycStatusChipClass("pending")).toContain("amber");
  });

  it("detects KYC blocked errors", () => {
    expect(isKycBlockedError("KYC not verified")).toBe(true);
    expect(isKycBlockedError("seller ready required")).toBe(true);
    expect(isKycBlockedError("network error")).toBe(false);
  });
});
