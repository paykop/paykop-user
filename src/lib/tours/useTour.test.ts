import { describe, expect, it, beforeEach } from "vitest";
import {
  getCompletedTours,
  isTourCompleted,
  markTourCompleted,
  resetTourCompleted,
} from "./useTour";
import { TOURS_REGISTRY } from "./tours";

const memory = new Map<string, string>();

function installLocalStorage() {
  memory.clear();
  const mock = {
    getItem: (key: string) => memory.get(key) ?? null,
    setItem: (key: string, value: string) => {
      memory.set(key, value);
    },
    removeItem: (key: string) => {
      memory.delete(key);
    },
    clear: () => memory.clear(),
    key: (index: number) => Array.from(memory.keys())[index] ?? null,
    get length() {
      return memory.size;
    },
  };
  Object.defineProperty(globalThis, "localStorage", {
    value: mock,
    configurable: true,
    writable: true,
  });
}

describe("Tours Registry & Storage", () => {
  beforeEach(() => {
    installLocalStorage();
  });

  it("registers valid tour definitions for buyer, seller, and agent", () => {
    expect(TOURS_REGISTRY.buyer_home).toBeDefined();
    expect(TOURS_REGISTRY.seller_hub).toBeDefined();
    expect(TOURS_REGISTRY.agent_hub).toBeDefined();

    expect(TOURS_REGISTRY.buyer_home.steps.length).toBeGreaterThan(0);
    expect(TOURS_REGISTRY.seller_hub.steps.length).toBeGreaterThan(0);
    expect(TOURS_REGISTRY.agent_hub.steps.length).toBeGreaterThan(0);
  });

  it("uses custom popoverClass matching theme styling", () => {
    expect(TOURS_REGISTRY.buyer_home.config?.popoverClass).toBe("paykop-tour-popover");
    expect(TOURS_REGISTRY.seller_hub.config?.popoverClass).toBe("paykop-tour-popover");
    expect(TOURS_REGISTRY.agent_hub.config?.popoverClass).toBe("paykop-tour-popover");
  });

  it("tracks completed tours in localStorage", () => {
    expect(isTourCompleted("buyer_home")).toBe(false);
    expect(getCompletedTours()).toEqual([]);

    markTourCompleted("buyer_home");
    expect(isTourCompleted("buyer_home")).toBe(true);
    expect(getCompletedTours()).toContain("buyer_home");

    // Idempotent completion
    markTourCompleted("buyer_home");
    expect(getCompletedTours().filter((id) => id === "buyer_home").length).toBe(1);

    markTourCompleted("seller_hub");
    expect(isTourCompleted("seller_hub")).toBe(true);
    expect(getCompletedTours()).toEqual(["buyer_home", "seller_hub"]);
  });

  it("resets tour completion status cleanly", () => {
    markTourCompleted("buyer_home");
    markTourCompleted("agent_hub");
    expect(isTourCompleted("buyer_home")).toBe(true);

    resetTourCompleted("buyer_home");
    expect(isTourCompleted("buyer_home")).toBe(false);
    expect(isTourCompleted("agent_hub")).toBe(true);
  });
});
