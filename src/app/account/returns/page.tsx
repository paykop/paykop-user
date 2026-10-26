"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  RotateCcw,
  ChevronRight,
  Loader2,
  Package,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
} from "lucide-react";
import { api } from "@/lib/api/endpoints";
import { ReturnRequest, ReturnReasonCode } from "@/types";
import { formatPaise } from "@/lib/money";
import { toast } from "@/lib/toast";

const REASON_LABELS: Record<string, string> = {
  damaged: "Damaged in transit",
  wrong_item: "Wrong item dispatched",
  not_as_described: "Not as described",
  defective: "Defective / Dead-on-arrival",
  changed_mind: "Changed mind",
  other: "Other reason",
};

export default function BuyerReturnsPage() {
  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<number | null>(null);

  const refreshReturns = () => {
    setLoading(true);
    api.returns
      .listBuyer({ page: 1, limit: 50 })
      .then((res) => setReturns(res.returns || []))
      .catch((err) => {
        console.error("Failed to load returns", err);
        setReturns([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    let cancelled = false;
    api.returns
      .listBuyer({ page: 1, limit: 50 })
      .then((res) => {
        if (!cancelled) setReturns(res.returns || []);
      })
      .catch((err) => {
        if (!cancelled) {
          console.error("Failed to load returns", err);
          setReturns([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleCancelReturn = async (id: number) => {
    if (!confirm("Are you sure you want to cancel this return request?")) return;
    setActionId(id);
    try {
      await api.returns.cancel(id);
      toast.success("Return cancelled successfully");
      refreshReturns();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to cancel return");
    } finally {
      setActionId(null);
    }
  };

  const handleConfirmReplacement = async (id: number) => {
    if (!confirm("Confirm that you have received and accepted the replacement product?")) return;
    setActionId(id);
    try {
      await api.returns.confirmReplacement(id);
      toast.success("Replacement receipt confirmed!");
      refreshReturns();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to confirm replacement");
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-gray-500">
        <Link href="/" className="hover:text-gray-900">
          Home
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href="/account" className="hover:text-gray-900">
          My Account
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="font-semibold text-gray-900">Returns & Refunds</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <RotateCcw className="w-6 h-6 text-[var(--primary)]" />
            <span>Returns & Refunds</span>
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Track status of item returns, replacement dispatches, and refund settlements
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh]">
          <Loader2 className="w-8 h-8 text-[var(--primary)] animate-spin" />
          <p className="text-xs text-gray-500 mt-2">Loading returns...</p>
        </div>
      ) : returns.length === 0 ? (
        <div className="shopcart-card p-12 text-center bg-white space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-gray-100 text-gray-400 flex items-center justify-center mx-auto">
            <RotateCcw className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">No return requests found</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            Delivered orders can be returned or replaced within the 7-day return window.
          </p>
          <Link
            href="/account/orders"
            className="inline-flex px-6 py-2.5 rounded-full shopcart-btn-primary text-xs font-bold shadow-sm"
          >
            View Delivered Orders
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {returns.map((ret) => (
            <div key={ret.id} className="shopcart-card p-6 bg-white space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-gray-900">
                    Return #{ret.id}
                  </span>
                  <span className="text-xs text-gray-400">·</span>
                  <Link
                    href={`/account/orders/${ret.order_id}`}
                    className="text-xs font-semibold text-[var(--primary)] hover:underline flex items-center gap-1"
                  >
                    <span>Order #{ret.order_id}</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-700">
                    {ret.resolution}
                  </span>
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      ret.status === "refunded" || ret.status === "replaced"
                        ? "bg-emerald-100 text-emerald-800"
                        : ret.status === "rejected"
                        ? "bg-red-100 text-red-800"
                        : ret.status === "escalated"
                        ? "bg-purple-100 text-purple-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {ret.status.replace("_", " ")}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-gray-600">
                <div>
                  <span className="text-gray-400 block text-[11px]">Reason:</span>
                  <span className="font-semibold text-gray-900">
                    {REASON_LABELS[ret.reason_code] || ret.reason_code}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[11px]">Units Returned:</span>
                  <span className="font-semibold text-gray-900">{ret.quantity} unit(s)</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[11px]">Refund Value:</span>
                  <span className="font-semibold text-gray-900">
                    {ret.refund_amount_paise > 0
                      ? formatPaise(ret.refund_amount_paise)
                      : "Pending inspection"}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[11px]">Date Filed:</span>
                  <span className="font-semibold text-gray-900">
                    {new Date(ret.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {ret.reason_text && (
                <div className="p-3 rounded-xl bg-gray-50 text-xs text-gray-700">
                  <span className="font-bold text-gray-800">Buyer note: </span>
                  {ret.reason_text}
                </div>
              )}

              {ret.decision_note && (
                <div className="p-3 rounded-xl bg-amber-50 text-xs text-amber-900">
                  <span className="font-bold">Merchant note: </span>
                  {ret.decision_note}
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <Link
                  href={`/account/orders/${ret.order_id}`}
                  className="text-xs font-bold text-[var(--primary)] hover:underline flex items-center gap-1"
                >
                  <span>Inspect Order & Evidence</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>

                <div className="flex items-center gap-2">
                  {ret.status === "requested" && (
                    <button
                      type="button"
                      disabled={actionId === ret.id}
                      onClick={() => handleCancelReturn(ret.id)}
                      className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                    >
                      {actionId === ret.id ? "Cancelling..." : "Cancel"}
                    </button>
                  )}

                  {ret.status === "replacement_dispatched" && (
                    <button
                      type="button"
                      disabled={actionId === ret.id}
                      onClick={() => handleConfirmReplacement(ret.id)}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 flex items-center gap-1.5 shadow-sm"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Confirm Received</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
