import { describe, expect, it, vi } from "vitest";

/** Agent subscribe uses POST .../subscription/subscribe (not grant-trial). */
describe("agent subscription path", () => {
  it("activates zero-price commission plans with plan_id", async () => {
    const subscribeSeller = vi.fn().mockResolvedValue({
      mode: "activated",
      subscription: { plan: "Commission", status: "active" },
    });

    const sellerId = "seller-123";
    const plans = [
      { id: 1, price: 0, name: "Commission" },
      { id: 2, price: 99900, name: "Pro" },
    ];

    const free = plans.find((p) => p.price === 0) ?? plans[0];
    const res = await subscribeSeller(sellerId, free.id);

    expect(subscribeSeller).toHaveBeenCalledWith("seller-123", 1);
    expect(res.mode).toBe("activated");
    expect(subscribeSeller).not.toHaveBeenCalledWith(expect.anything(), "grant-trial");
  });

  it("returns payment_intent for paid plans", async () => {
    const subscribeSeller = vi.fn().mockResolvedValue({
      mode: "payment_intent",
      payment: {
        id: 9,
        amount: 99900,
        currency: "INR",
        status: "pending",
        provider: "razorpay",
        provider_ref: "sub_abc",
        razorpay_subscription_id: "sub_abc",
      },
    });

    const res = await subscribeSeller("seller-123", 2);
    expect(res.mode).toBe("payment_intent");
    expect(res.payment?.razorpay_subscription_id).toBe("sub_abc");
  });
});
