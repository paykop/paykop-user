import { describe, expect, it, vi, beforeEach } from "vitest";
import { queryKeys } from "@/lib/queries/keys";
import { CreateReturnInput, BuyerEscalateReturnInput, SellerRejectReturnInput, SellerReceiveReturnInput } from "@/types";

vi.mock("@/lib/api/client", () => ({
  apiClient: vi.fn(),
  fetchWithAuth: vi.fn(),
  fetchPublic: vi.fn(),
}));

import { apiClient } from "@/lib/api/client";
import { api } from "@/lib/api/endpoints";

describe("returns API client & query keys", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("query keys", () => {
    it("generates correct query keys for buyer and seller returns", () => {
      expect(queryKeys.buyerReturns(1, 10)).toEqual(["buyer-returns", 1, 10]);
      expect(queryKeys.buyerReturn("ret_123")).toEqual(["buyer-return", "ret_123"]);
      expect(queryKeys.orderReturns("ord_456")).toEqual(["order-returns", "ord_456"]);
      expect(queryKeys.sellerReturns("requested", 1, 20)).toEqual(["seller-returns", "requested", 1, 20]);
      expect(queryKeys.sellerReturn("ret_789")).toEqual(["seller-return", "ret_789"]);
    });
  });

  describe("buyer returns methods", () => {
    it("calls create return with proper endpoint and body", async () => {
      vi.mocked(apiClient).mockResolvedValueOnce({ id: "ret_1" });

      const input: CreateReturnInput = {
        reason_code: "damaged",
        reason_text: "Item was crushed on arrival",
        resolution: "refund",
        quantity: 1,
        attachments: [{ file_key: "return/u1/photo.jpg", file_url: "https://cdn.example/return/u1/photo.jpg" }],
      };

      const result = await api.returns.create("ord_999", input);

      expect(apiClient).toHaveBeenCalledWith("/buyer/orders/ord_999/returns", {
        method: "POST",
        body: JSON.stringify(input),
      });
      expect(result).toEqual({ id: "ret_1" });
    });

    it("calls listBuyer with optional page/limit params", async () => {
      vi.mocked(apiClient).mockResolvedValueOnce({ returns: [], total: 0 });

      await api.returns.listBuyer({ page: 2, limit: 10 });

      expect(apiClient).toHaveBeenCalledWith("/buyer/returns", {
        params: { page: 2, limit: 10 },
      });
    });

    it("calls cancel return", async () => {
      vi.mocked(apiClient).mockResolvedValueOnce({ id: "ret_1", status: "cancelled" });

      await api.returns.cancel("ret_1");

      expect(apiClient).toHaveBeenCalledWith("/buyer/returns/ret_1/cancel", {
        method: "POST",
      });
    });

    it("calls escalate dispute with escalation note", async () => {
      vi.mocked(apiClient).mockResolvedValueOnce({ id: "ret_1", status: "escalated" });

      const escalateInput: BuyerEscalateReturnInput = { note: "Seller wrongfully rejected valid claim" };
      await api.returns.escalate("ret_1", escalateInput);

      expect(apiClient).toHaveBeenCalledWith("/buyer/returns/ret_1/escalate", {
        method: "POST",
        body: JSON.stringify(escalateInput),
      });
    });

    it("calls confirm replacement receipt", async () => {
      vi.mocked(apiClient).mockResolvedValueOnce({ id: "ret_1", status: "completed" });

      await api.returns.confirmReplacement("ret_1");

      expect(apiClient).toHaveBeenCalledWith("/buyer/returns/ret_1/confirm-replacement", {
        method: "POST",
      });
    });
  });

  describe("seller returns methods", () => {
    it("calls approveSeller", async () => {
      vi.mocked(apiClient).mockResolvedValueOnce({ id: "ret_1", status: "approved" });

      await api.returns.approveSeller("ret_1");

      expect(apiClient).toHaveBeenCalledWith("/seller/returns/ret_1/approve", {
        method: "POST",
      });
    });

    it("calls rejectSeller with rejection reason", async () => {
      vi.mocked(apiClient).mockResolvedValueOnce({ id: "ret_1", status: "rejected" });

      const rejectInput: SellerRejectReturnInput = { reason: "Damage caused by buyer misuse" };
      await api.returns.rejectSeller("ret_1", rejectInput);

      expect(apiClient).toHaveBeenCalledWith("/seller/returns/ret_1/reject", {
        method: "POST",
        body: JSON.stringify(rejectInput),
      });
    });

    it("calls receiveSeller with inspection note and status", async () => {
      vi.mocked(apiClient).mockResolvedValueOnce({ id: "ret_1", status: "refunded" });

      const receiveInput: SellerReceiveReturnInput = {
        inspection_ok: true,
        inspection_note: "Item returned in good faith with original packaging",
      };
      await api.returns.receiveSeller("ret_1", receiveInput);

      expect(apiClient).toHaveBeenCalledWith("/seller/returns/ret_1/receive", {
        method: "POST",
        body: JSON.stringify(receiveInput),
      });
    });

    it("calls dispatchReplacementSeller", async () => {
      vi.mocked(apiClient).mockResolvedValueOnce({ id: "ret_1", status: "replacement_dispatched" });

      await api.returns.dispatchReplacementSeller("ret_1");

      expect(apiClient).toHaveBeenCalledWith("/seller/returns/ret_1/dispatch-replacement", {
        method: "POST",
      });
    });
  });
});
