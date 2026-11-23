"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  RotateCcw,
  ChevronRight,
  Loader2,
  CheckCircle2,
  XCircle,
  Truck,
  Package,
  AlertTriangle,
  FileCheck2,
  X,
  ExternalLink,
} from "lucide-react";
import { MediaThumb } from "@/components/ui/MediaThumb";
import { api } from "@/lib/api/endpoints";
import { ReturnRequest, ReturnStatus } from "@/types";
import { formatPaise } from "@/lib/money";
import { toast } from "@/lib/toast";

const STATUS_TABS: { label: string; value: string }[] = [
  { label: "All Returns", value: "" },
  { label: "Pending Review", value: "requested" },
  { label: "Approved (Pending Goods)", value: "approved" },
  { label: "Received", value: "received" },
  { label: "Refunded", value: "refunded" },
  { label: "Replacement Dispatched", value: "replacement_dispatched" },
  { label: "Dispute Escalated", value: "escalated" },
  { label: "Rejected", value: "rejected" },
];

export default function SellerReturnsPage() {
  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);

  // Reject Modal
  const [rejectModalItem, setRejectModalItem] = useState<ReturnRequest | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [submittingReject, setSubmittingReject] = useState(false);

  // Receive / Inspect Modal
  const [receiveModalItem, setReceiveModalItem] = useState<ReturnRequest | null>(null);
  const [inspectionOk, setInspectionOk] = useState(true);
  const [inspectionNote, setInspectionNote] = useState("");
  const [submittingReceive, setSubmittingReceive] = useState(false);

  const refreshReturns = (status = selectedStatus) => {
    setLoading(true);
    api.returns
      .listSeller({ status: status || undefined, page: 1, limit: 50 })
      .then((res) => setReturns(res.returns || []))
      .catch((err) => {
        console.error("Failed to load seller returns", err);
        setReturns([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    let cancelled = false;
    api.returns
      .listSeller({ status: selectedStatus || undefined, page: 1, limit: 50 })
      .then((res) => {
        if (!cancelled) setReturns(res.returns || []);
      })
      .catch((err) => {
        if (!cancelled) {
          console.error("Failed to load seller returns", err);
          setReturns([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedStatus]);

  const handleApprove = async (returnId: number) => {
    if (!confirm("Approve this return request? Buyer will be notified to return the item.")) return;
    setProcessingId(returnId);
    try {
      await api.returns.approveSeller(returnId);
      toast.success("Return approved");
      refreshReturns();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to approve return");
    } finally {
      setProcessingId(null);
    }
  };

  const handleConfirmReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectModalItem || !rejectReason.trim()) {
      toast.error("Please provide a rejection explanation.");
      return;
    }

    setSubmittingReject(true);
    try {
      await api.returns.rejectSeller(rejectModalItem.id, { reason: rejectReason.trim() });
      toast.success("Return request rejected");
      setRejectModalItem(null);
      setRejectReason("");
      refreshReturns();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to reject return");
    } finally {
      setSubmittingReject(false);
    }
  };

  const handleConfirmReceive = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiveModalItem) return;

    setSubmittingReceive(true);
    try {
      await api.returns.receiveSeller(receiveModalItem.id, {
        inspection_ok: inspectionOk,
        inspection_note: inspectionNote.trim() || undefined,
      });

      if (inspectionOk && receiveModalItem.resolution === "refund") {
        toast.success("Return goods accepted! Refund executed via automated refund engine.");
      } else if (inspectionOk && receiveModalItem.resolution === "replacement") {
        toast.success("Return goods received! Ready to dispatch replacement.");
      } else {
        toast.success("Inspection failed; return rejected.");
      }

      setReceiveModalItem(null);
      setInspectionNote("");
      refreshReturns();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to process receipt");
    } finally {
      setSubmittingReceive(false);
    }
  };

  const handleDispatchReplacement = async (returnId: number) => {
    if (!confirm("Dispatch replacement item? Merchant inventory will be atomically reserved.")) return;
    setProcessingId(returnId);
    try {
      await api.returns.dispatchReplacementSeller(returnId);
      toast.success("Replacement item marked as dispatched!");
      refreshReturns();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to dispatch replacement");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-gray-500">
        <Link href="/seller" className="hover:text-gray-900">
          Seller Hub
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="font-semibold text-gray-900">Returns Management</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <RotateCcw className="w-6 h-6 text-[var(--primary)]" />
            <span>Customer Returns & Replacements</span>
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Review return claims, inspect received packages, dispatch replacements, and manage automated refunds
          </p>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setSelectedStatus(tab.value)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap cursor-pointer transition-colors ${
              selectedStatus === tab.value
                ? "bg-[var(--primary)] text-white shadow-xs"
                : "bg-white text-gray-600 border border-gray-200 hover:border-gray-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh]">
          <Loader2 className="w-8 h-8 text-[var(--primary)] animate-spin" />
          <p className="text-xs text-gray-500 mt-2">Loading returns...</p>
        </div>
      ) : returns.length === 0 ? (
        <div className="shopcart-card p-12 text-center bg-white space-y-3">
          <Package className="w-10 h-10 text-gray-300 mx-auto" />
          <h3 className="font-bold text-sm text-gray-900">No return requests found</h3>
          <p className="text-xs text-gray-500">
            {selectedStatus ? "No returns matching this filter." : "No customer returns filed yet."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {returns.map((ret) => (
            <div key={ret.id} className="shopcart-card p-6 bg-white space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-gray-900">Return #{ret.id}</span>
                  <span className="text-xs text-gray-400">·</span>
                  <span className="text-xs text-gray-500">Order #{ret.order_id}</span>
                  <span className="text-xs text-gray-400">·</span>
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-600">
                    {ret.resolution}
                  </span>
                </div>

                <span
                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider self-start sm:self-auto ${
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

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-gray-600">
                <div>
                  <span className="text-gray-400 block text-[11px]">Buyer:</span>
                  <span className="font-semibold text-gray-900">{ret.buyer_id}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[11px]">Reason Code:</span>
                  <span className="font-semibold text-gray-900 capitalize">
                    {ret.reason_code.replace("_", " ")}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[11px]">Return Qty:</span>
                  <span className="font-semibold text-gray-900">{ret.quantity} unit(s)</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[11px]">Refund Snapshot:</span>
                  <span className="font-semibold text-gray-900">
                    {ret.refund_amount_paise > 0
                      ? formatPaise(ret.refund_amount_paise)
                      : "To be calculated"}
                  </span>
                </div>
              </div>

              {ret.reason_text && (
                <div className="p-3 rounded-xl bg-gray-50 text-xs text-gray-700">
                  <span className="font-bold text-gray-900">Buyer note: </span>
                  {ret.reason_text}
                </div>
              )}

              {ret.decision_note && (
                <div className="p-3 rounded-xl bg-amber-50 text-xs text-amber-900">
                  <span className="font-bold">Decision note: </span>
                  {ret.decision_note}
                </div>
              )}

              {/* Photos */}
              {ret.attachments && ret.attachments.length > 0 && (
                <div>
                  <span className="text-xs font-bold text-gray-700 block mb-2">Evidence Photos:</span>
                  <div className="flex flex-wrap gap-2">
                    {ret.attachments.map((att) => (
                      <a
                        key={att.id}
                        href={att.file_url}
                        target="_blank"
                        rel="noreferrer"
                        className="w-16 h-16 rounded-xl overflow-hidden border border-gray-200 bg-white block relative"
                      >
                        <MediaThumb src={att.file_url} alt="Evidence" className="object-cover" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Merchant Workflow Buttons */}
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100">
                {ret.status === "requested" && (
                  <>
                    <button
                      type="button"
                      disabled={processingId === ret.id}
                      onClick={() => handleApprove(ret.id)}
                      className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 flex items-center gap-1.5 shadow-sm"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Approve Return</span>
                    </button>
                    <button
                      type="button"
                      disabled={processingId === ret.id}
                      onClick={() => setRejectModalItem(ret)}
                      className="px-4 py-2 rounded-xl border border-red-200 text-red-600 text-xs font-bold hover:bg-red-50 flex items-center gap-1.5"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Reject Return</span>
                    </button>
                  </>
                )}

                {ret.status === "approved" && (
                  <button
                    type="button"
                    onClick={() => {
                      setReceiveModalItem(ret);
                      setInspectionOk(true);
                      setInspectionNote("");
                    }}
                    className="px-4 py-2 rounded-xl shopcart-btn-primary text-xs font-bold flex items-center gap-1.5 shadow-sm"
                  >
                    <FileCheck2 className="w-3.5 h-3.5" />
                    <span>Receive & Inspect Goods</span>
                  </button>
                )}

                {ret.status === "received" && ret.resolution === "replacement" && (
                  <button
                    type="button"
                    disabled={processingId === ret.id}
                    onClick={() => handleDispatchReplacement(ret.id)}
                    className="px-4 py-2 rounded-xl bg-[var(--primary)] text-white text-xs font-bold hover:bg-[var(--primary-dark)] flex items-center gap-1.5 shadow-sm"
                  >
                    <Truck className="w-3.5 h-3.5 text-[var(--accent-green)]" />
                    <span>Dispatch Replacement</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reject Modal */}
      {rejectModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <h3 className="font-bold text-base text-gray-900">Reject Return Request</h3>
              <button
                type="button"
                onClick={() => setRejectModalItem(null)}
                className="p-1 rounded-full text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmReject} className="space-y-4">
              <p className="text-xs text-gray-600">
                Provide a clear reason for rejecting Return #{rejectModalItem.id}. The buyer will receive this explanation and may escalate to admin mediation.
              </p>

              <textarea
                required
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Item was marked as clearance non-returnable stock..."
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs"
              />

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectModalItem(null)}
                  className="px-4 py-2 rounded-full border border-gray-200 text-xs font-semibold text-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReject}
                  className="px-6 py-2.5 rounded-full bg-red-600 text-white text-xs font-bold hover:bg-red-700 disabled:opacity-50 flex items-center gap-2 shadow-sm"
                >
                  {submittingReject && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Confirm Rejection</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Receive & Inspect Modal */}
      {receiveModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <h3 className="font-bold text-base text-gray-900">Inspect Returned Physical Goods</h3>
              <button
                type="button"
                onClick={() => setReceiveModalItem(null)}
                className="p-1 rounded-full text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmReceive} className="space-y-4">
              <p className="text-xs text-gray-600">
                Confirm physical handover and inspection results for Return #{receiveModalItem.id} ({receiveModalItem.quantity} unit(s)).
              </p>

              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-2">
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={inspectionOk}
                    onChange={(e) => setInspectionOk(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="font-bold text-xs text-gray-900">
                    Goods passed return quality inspection
                  </span>
                </label>
                <p className="text-[11px] text-gray-500 pl-7">
                  {inspectionOk
                    ? receiveModalItem.resolution === "refund"
                      ? "Passing inspection triggers automated gateway/cash refund execution and restocks item."
                      : "Passing inspection prepares order for replacement dispatch."
                    : "Failing inspection marks the return as rejected."}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Inspection Observations / Notes (Optional)
                </label>
                <textarea
                  rows={3}
                  value={inspectionNote}
                  onChange={(e) => setInspectionNote(e.target.value)}
                  placeholder="e.g. Package received in intact condition with serial match..."
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setReceiveModalItem(null)}
                  className="px-4 py-2 rounded-full border border-gray-200 text-xs font-semibold text-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReceive}
                  className="px-6 py-2.5 rounded-full shopcart-btn-primary text-xs font-bold disabled:opacity-50 flex items-center gap-2 shadow-sm"
                >
                  {submittingReceive && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Record Inspection</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
