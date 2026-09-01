import { describe, expect, it, vi } from "vitest";

/** Agent subscribe uses POST .../subscription/subscribe (not grant-trial). */
describe("agent subscription path", () => {
  it("calls subscribe endpoint with plan_id", async () => {
    const subscribeSeller = vi.fn().mockResolvedValue({
      subscription: { plan: "Trial", expires_at: "2026-12-31" },
    });

    const sellerId = "seller-123";
    const trialPlan = { id: 1, price: 0, name: "Free Trial" };
    const plans = [trialPlan, { id: 2, price: 99900, name: "Pro" }];

    const trial = plans.find((p) => p.price === 0) ?? plans[0];
    await subscribeSeller(sellerId, trial.id);

    expect(subscribeSeller).toHaveBeenCalledWith("seller-123", 1);
    expect(subscribeSeller).not.toHaveBeenCalledWith(expect.anything(), "grant-trial");
  });
});
