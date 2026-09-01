import { describe, expect, it } from "vitest";
import {
  highlightQuery,
  searchResultHref,
  searchResultLabel,
  searchTabToApiType,
} from "@/lib/search/routes";
import { SearchResult } from "@/types";

describe("search routes", () => {
  it("maps result types to storefront routes", () => {
    expect(searchResultHref({ type: "product", id: 42, title: "Milk", subtitle: "", score: 1 })).toBe(
      "/products/42"
    );
    expect(searchResultHref({ type: "service", id: 7, title: "Plumber", subtitle: "", score: 1 })).toBe(
      "/services/7"
    );
    expect(
      searchResultHref({ type: "donation_campaign", id: 3, title: "Help", subtitle: "", score: 1 })
    ).toBe("/donations/3");
    expect(
      searchResultHref({ type: "blood_request", id: 9, title: "O+", subtitle: "", score: 1 })
    ).toBe("/blood?request_id=9");
    expect(searchResultHref({ type: "blood_donor", id: 1, title: "Donor", subtitle: "", score: 1 })).toBe(
      "/blood"
    );
  });

  it("does not wrap query in wildcards for user search fallback", () => {
    const result: SearchResult = { type: "user", id: "u1", title: "Jane Doe", subtitle: "", score: 1 };
    expect(searchResultHref(result)).toBe("/search?q=Jane%20Doe&type=user");
  });

  it("maps tabs to API type filters", () => {
    expect(searchTabToApiType("products")).toBe("product");
    expect(searchTabToApiType("services")).toBe("service");
    expect(searchTabToApiType("donations")).toBe("donation");
    expect(searchTabToApiType("users")).toBe("user");
    expect(searchTabToApiType("all")).toBeUndefined();
  });

  it("highlights query substring in titles", () => {
    expect(highlightQuery("Fresh Milk", "mil")).toEqual({
      before: "Fresh ",
      match: "Mil",
      after: "k",
    });
    expect(highlightQuery("Bread", "xyz")).toEqual({ before: "Bread", match: "", after: "" });
  });

  it("returns human-readable type labels", () => {
    expect(searchResultLabel("product")).toBe("Product");
    expect(searchResultLabel("blood_request")).toBe("Blood request");
  });
});
