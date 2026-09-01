import { describe, expect, it } from "vitest";
import { formatPaise, paiseToRupees, rupeesToPaise, calculateDiscountPercentage } from "@/lib/money";

describe("money", () => {
  it("converts paise to rupees", () => {
    expect(paiseToRupees(100)).toBe(1);
    expect(paiseToRupees(0)).toBe(0);
  });

  it("converts rupees to paise", () => {
    expect(rupeesToPaise(1.5)).toBe(150);
  });

  it("formats paise as INR", () => {
    expect(formatPaise(100)).toContain("1");
    expect(formatPaise(NaN)).toBe("₹0");
  });

  it("calculates discount percentage", () => {
    expect(calculateDiscountPercentage(10000, 8000)).toBe(20);
    expect(calculateDiscountPercentage(100, 100)).toBe(0);
  });
});
