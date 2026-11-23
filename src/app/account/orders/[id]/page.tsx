"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { MediaThumb } from "@/components/ui/MediaThumb";
import Link from "next/link";
import {
  ChevronRight,
  Loader2,
  KeyRound,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Truck,
  Upload,
  X,
  ShieldAlert,
  Sprout,
} from "lucide-react";
import { api } from "@/lib/api/endpoints";
import {
  Order,
  PaymentIntentResponse,
  ReturnRequest,
  ReturnResolution,
  ReturnReasonCode,
} from "@/types";
import { formatPaise } from "@/lib/money";
import { toast } from "@/lib/toast";
import { uploadViaPresignedUrl } from "@/lib/upload/presignedUpload";

const REASON_LABELS: Record<ReturnReasonCode, string> = {
  damaged: "Damaged / Broken in transit",
  wrong_item: "Wrong Item / Variant received",
  not_as_described: "Not as Described on storefront",
  defective: "Defective / Non-functional",
  changed_mind: "Changed Mind / No longer needed",
  other: "Other Reason",
};

export default function OrderDetailPage() {
  const params = useParams();
  const orderId = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);
  const [paymentInfo, setPaymentInfo] = useState<PaymentIntentResponse | null>(null);
  const [msg, setMsg] = useState("");

  // Returns state
  const [orderReturns, setOrderReturns] = useState<ReturnRequest[]>([]);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [resolution, setResolution] = useState<ReturnResolution>("refund");
  const [reasonCode, setReasonCode] = useState<ReturnReasonCode>("damaged");
  const [reasonText, setReasonText] = useState("");
  const [returnQty, setReturnQty] = useState(1);
  const [evidenceFiles, setEvidenceFiles] = useState<File[]>([]);
  const [submittingReturn, setSubmittingReturn] = useState(false);

  // Escalation state
  const [showEscalateModal, setShowEscalateModal] = useState(false);
  const [escalateNote, setEscalateNote] = useState("");
  const [escalating, setEscalating] = useState(false);

  const [actionLoading, setActionLoading] = useState(false);

  const loadData = () => {
    api.orders
      .getById(orderId)
      .then((data) => {
        setOrder(data);
        setReturnQty(data.quantity || 1);
      })
      .catch(() => setOrder(null))
      .finally(() => setLoading(false));

    api.orders
      .getPayment(orderId)
      .then((p) => {
        setPaymentStatus(p.status);
        setPaymentInfo(p);
      })
      .catch(() => {
        setPaymentStatus(null);
        setPaymentInfo(null);
      });

    api.returns
      .listOrderReturns(orderId)
      .then((res) => setOrderReturns(res.returns || []))
      .catch(() => setOrderReturns([]));
  };

  useEffect(() => {
    loadData();
  }, [orderId]);

  const handleCancelOrder = async () => {
    if (!confirm("Are you sure you want to cancel this order?")) return;
    setCancelling(true);
    try {
      await api.orders.cancel(orderId);
      setMsg("Order cancelled successfully.");
      loadData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to cancel order");
    } finally {
      setCancelling(false);
    }
  };

  const handleRegenerateOtp = async () => {
    setRegenerating(true);
    try {
      const res = await api.orders.regenerateOtp(orderId);
      setOrder((prev) => (prev ? { ...prev, delivery_otp: res.delivery_otp } : prev));
      toast.success("New delivery OTP generated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to regenerate OTP");
    } finally {
      setRegenerating(false);
    }
  };

  const handleEvidenceFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const incoming = Array.from(e.target.files);
    if (evidenceFiles.length + incoming.length > 5) {
      toast.error("You can attach up to 5 photos as return evidence.");
      return;
    }
    setEvidenceFiles((prev) => [...prev, ...incoming].slice(0, 5));
  };

  const handleRemoveEvidence = (index: number) => {
    setEvidenceFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmitReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (evidenceFiles.length === 0) {
      toast.error("At least 1 photo evidence attachment is required.");
      return;
    }
    if (returnQty < 1 || (order && returnQty > order.quantity)) {
      toast.error(`Return quantity must be between 1 and ${order?.quantity || 1}`);
      return;
    }

    setSubmittingReturn(true);
    try {
      // 1. Upload proof photos with purpose: "return"
      const attachments: { file_key: string; file_url: string }[] = [];
      for (const file of evidenceFiles) {
        const uploadRes = await uploadViaPresignedUrl(file, "return");
        attachments.push({
          file_key: uploadRes.key,
          file_url: uploadRes.publicUrl,
        });
      }

      // 2. Submit return request
      await api.returns.create(orderId, {
        resolution,
        reason_code: reasonCode,
        reason_text: reasonText.trim() || undefined,
        quantity: returnQty,
        attachments,
      });

      toast.success("Return request submitted successfully!");
      setShowReturnModal(false);
      setEvidenceFiles([]);
      setReasonText("");
      loadData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to submit return request");
    } finally {
      setSubmittingReturn(false);
    }
  };

  const handleCancelReturn = async (returnId: number) => {
    if (!confirm("Are you sure you want to cancel this return request?")) return;
    setActionLoading(true);
    try {
      await api.returns.cancel(returnId);
      toast.success("Return request cancelled");
      loadData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to cancel return");
    } finally {
      setActionLoading(false);
    }
  };

  const handleEscalateReturn = async (returnId: number) => {
    setEscalating(true);
    try {
      await api.returns.escalate(returnId, { note: escalateNote.trim() || undefined });
      toast.success("Dispute escalated to admin mediation");
      setShowEscalateModal(false);
      setEscalateNote("");
      loadData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to escalate return");
    } finally {
      setEscalating(false);
    }
  };

  const handleConfirmReplacement = async (returnId: number) => {
    if (!confirm("Confirm that you have received and accepted the replacement product?")) return;
    setActionLoading(true);
    try {
      await api.returns.confirmReplacement(returnId);
      toast.success("Replacement receipt confirmed!");
      loadData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to confirm replacement");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-[var(--primary)] animate-spin" />
        <p className="text-xs text-gray-500 mt-2">Loading order #{orderId}...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-xl font-bold text-gray-900">Order #{orderId} not found</h2>
        <Link href="/account/orders" className="inline-flex px-6 py-3 rounded-full shopcart-btn-primary text-xs font-bold">
          View All Orders
        </Link>
      </div>
    );
  }

  const title = order.product?.title || `Product #${order.product_id}`;
  const img =
    order.product?.images && order.product.images.startsWith("http")
      ? order.product.images
      : null;

  const isDelivered = order.status.toLowerCase() === "delivered";
  const isCod = paymentInfo?.provider === "cash";
  const isOrderPaidOrCod =
    order.status.toLowerCase() === "paid" ||
    order.status.toLowerCase() === "dispatched" ||
    order.status.toLowerCase() === "shipped" ||
    (isCod &&
      order.status.toLowerCase() !== "cancelled" &&
      order.status.toLowerCase() !== "failed");
  const deliveredAt = order.delivered_at ? new Date(order.delivered_at).getTime() : 0;
  const isFarm = order.vertical === "farm";
  // Farm perishables have 24h return window; standard retail items have 7 days (168h)
  const returnWindowDuration = isFarm ? 24 * 3600 * 1000 : 168 * 3600 * 1000;
  const withinReturnWindow =
    isDelivered &&
    deliveredAt > 0 &&
    (order.return_window_closes_at
      ? new Date(order.return_window_closes_at).getTime() > Date.now()
      : Date.now() - deliveredAt <= returnWindowDuration);
  const activeReturn = orderReturns.find(
    (r) => !["cancelled", "rejected", "replaced", "refunded"].includes(r.status)
  ) || orderReturns[0];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-gray-500">
        <Link href="/" className="hover:text-gray-900">
          Home
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href="/account/orders" className="hover:text-gray-900">
          My Orders
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="font-semibold text-gray-900">Order #{order.id}</span>
      </nav>

      {msg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800">
          {msg}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">
              Order #{order.id}
            </h1>
            {isFarm && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 text-xs font-bold">
                <Sprout className="w-3.5 h-3.5 text-emerald-700" />
                <span>Paykop Farm Order</span>
              </span>
            )}
            <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold uppercase">
              {order.status}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Placed on {new Date(order.created_at).toLocaleString()}
            {order.delivered_at && (
              <> · Delivered on {new Date(order.delivered_at).toLocaleString()}</>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {["pending", "paid"].includes(order.status.toLowerCase()) && (
            <button
              onClick={handleCancelOrder}
              disabled={cancelling}
              className="px-4 py-2 rounded-xl text-xs font-bold text-red-600 border border-red-200 hover:bg-red-50 transition-colors cursor-pointer self-start sm:self-auto"
            >
              {cancelling ? "Cancelling..." : "Cancel Order"}
            </button>
          )}

          {isDelivered && withinReturnWindow && !activeReturn && (
            <button
              onClick={() => setShowReturnModal(true)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-[var(--primary)] border border-[var(--primary)] hover:bg-[var(--primary)]/5 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Return / Replace</span>
            </button>
          )}
        </div>
      </div>

      {/* Active Return Banner / Status */}
      {activeReturn && (
        <div className="shopcart-card p-6 bg-amber-50/50 border border-amber-200/80 rounded-3xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-amber-700 shrink-0" />
              <h3 className="font-bold text-sm text-gray-900">
                Return Request #{activeReturn.id} ·{" "}
                <span className="capitalize">{activeReturn.resolution}</span>
              </h3>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                activeReturn.status === "refunded" || activeReturn.status === "replaced"
                  ? "bg-emerald-100 text-emerald-800"
                  : activeReturn.status === "rejected"
                  ? "bg-red-100 text-red-800"
                  : activeReturn.status === "escalated"
                  ? "bg-purple-100 text-purple-800"
                  : "bg-amber-100 text-amber-800"
              }`}
            >
              {activeReturn.status.replace("_", " ")}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs pt-2 border-t border-amber-200/50">
            <div>
              <span className="text-gray-500 block">Reason:</span>
              <span className="font-semibold text-gray-900">
                {REASON_LABELS[activeReturn.reason_code] || activeReturn.reason_code}
              </span>
            </div>
            <div>
              <span className="text-gray-500 block">Quantity:</span>
              <span className="font-semibold text-gray-900">{activeReturn.quantity} unit(s)</span>
            </div>
            <div>
              <span className="text-gray-500 block">Refund Amount:</span>
              <span className="font-semibold text-gray-900">
                {activeReturn.refund_amount_paise > 0
                  ? formatPaise(activeReturn.refund_amount_paise)
                  : "Pending inspection"}
              </span>
            </div>
          </div>

          {activeReturn.reason_text && (
            <p className="text-xs text-gray-600 bg-white/60 p-3 rounded-xl border border-amber-100">
              <span className="font-bold text-gray-700">Note: </span>
              {activeReturn.reason_text}
            </p>
          )}

          {activeReturn.decision_note && (
            <div className="p-3 rounded-xl bg-white/80 border border-amber-200/60 text-xs text-gray-700 space-y-1">
              <span className="font-bold text-amber-900 block">Decision / Inspection Note:</span>
              <p>{activeReturn.decision_note}</p>
            </div>
          )}

          {/* Attachments preview */}
          {activeReturn.attachments && activeReturn.attachments.length > 0 && (
            <div>
              <span className="text-xs font-bold text-gray-700 block mb-2">Attached Proof:</span>
              <div className="flex flex-wrap gap-2">
                {activeReturn.attachments.map((att) => (
                  <a
                    key={att.id}
                    href={att.file_url}
                    target="_blank"
                    rel="noreferrer"
                    className="w-16 h-16 rounded-xl overflow-hidden border border-gray-200 bg-white block relative"
                  >
                    <MediaThumb src={att.file_url} alt="Proof" className="object-cover" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2 pt-2">
            {activeReturn.status === "requested" && (
              <button
                type="button"
                onClick={() => handleCancelReturn(activeReturn.id)}
                disabled={actionLoading}
                className="px-3.5 py-1.5 rounded-xl border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel Return
              </button>
            )}

            {activeReturn.status === "rejected" && !activeReturn.escalated_at && (
              <button
                type="button"
                onClick={() => setShowEscalateModal(true)}
                className="px-3.5 py-1.5 rounded-xl bg-purple-600 text-white text-xs font-bold hover:bg-purple-700 transition-colors flex items-center gap-1.5"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Escalate Dispute</span>
              </button>
            )}

            {activeReturn.status === "replacement_dispatched" && (
              <button
                type="button"
                onClick={() => handleConfirmReplacement(activeReturn.id)}
                disabled={actionLoading}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Confirm Replacement Received</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Pending Payment Notice */}
      {order.status.toLowerCase() === "pending" && !isCod && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div>
            <span className="font-bold block text-sm">Payment Pending</span>
            <span className="text-amber-700">This order is awaiting payment confirmation. Delivery OTP is only issued once payment is completed.</span>
          </div>
          <button
            onClick={handleCancelOrder}
            disabled={cancelling}
            className="px-4 py-2 rounded-xl bg-amber-200 text-amber-900 font-bold hover:bg-amber-300 transition-colors shrink-0 cursor-pointer disabled:opacity-50"
          >
            {cancelling ? "Cancelling..." : "Cancel Order"}
          </button>
        </div>
      )}

      {/* Delivery OTP Banner */}
      {order.delivery_otp && isOrderPaidOrCod && !isDelivered && (
        <div className="p-6 rounded-3xl bg-[var(--primary)] text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md">
          <div className="flex items-center gap-3 text-center sm:text-left flex-col sm:flex-row">
            <div className="w-12 h-12 rounded-2xl bg-[var(--accent-green)] text-[var(--primary-dark)] flex items-center justify-center">
              <KeyRound className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Your Delivery Verification OTP</h3>
              <p className="text-xs text-white/70">
                Share this OTP with the delivery person only after inspecting your product package.
              </p>
            </div>
          </div>

          <div className="px-6 py-2.5 rounded-2xl bg-white text-[var(--primary)] text-center font-mono font-black text-2xl tracking-widest shadow-inner">
            {order.delivery_otp}
          </div>
          <button
            type="button"
            onClick={handleRegenerateOtp}
            disabled={regenerating}
            className="text-xs font-bold underline text-white/90 cursor-pointer disabled:opacity-50"
          >
            Regenerate OTP
          </button>
        </div>
      )}

      {paymentStatus && (
        <p className="text-xs text-gray-500">
          Payment status: <span className="font-bold text-gray-800">{paymentStatus}</span>
        </p>
      )}

      {/* Item Details Card */}
      <div className="shopcart-card p-6 bg-white space-y-6">
        <h3 className="font-black text-base text-gray-900 pb-3 border-b border-gray-100">
          Purchased Item
        </h3>

        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-2xl overflow-hidden relative bg-gray-50 shrink-0 border border-gray-100">
            <MediaThumb src={img} alt={title} className="object-cover" />
          </div>
          <div className="space-y-1 flex-1">
            <h4 className="font-bold text-sm text-gray-900">{title}</h4>
            {isFarm && order.farm_name && (
              <p className="text-[11px] text-emerald-800 font-medium">
                Sourced from: <strong>{order.farm_name}</strong> (Paykop Farm Vertical)
              </p>
            )}
            <div className="text-xs text-gray-500">
              Quantity:{" "}
              {isFarm && order.quantity_milli
                ? `${order.quantity_milli / 1000} ${order.unit || "kg"}`
                : order.quantity}{" "}
              x {formatPaise(order.product?.price || order.total_price / order.quantity)}
            </div>
            <div className="text-sm font-black text-[var(--primary)] pt-1">
              Total: {formatPaise(order.total_price)}
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-gray-600">
          <div>
            <span className="font-bold text-gray-900 block mb-1">
              {isFarm ? "Farmer / Producer Identity:" : "Seller Identity:"}
            </span>
            <span>{order.seller_id}</span>
          </div>
          <div>
            <span className="font-bold text-gray-900 block mb-1">Fulfillment Vertical:</span>
            <span>{isFarm ? "Paykop Farm (Agricultural Cold/Direct)" : "Local Hyperlocal Dispatch"}</span>
          </div>
        </div>
      </div>

      {/* Return Request Modal */}
      {showReturnModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-[var(--primary)]" />
                <h3 className="font-bold text-base text-gray-900">Request Return or Replacement</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowReturnModal(false)}
                className="p-1 rounded-full text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitReturn} className="space-y-4">
              {/* Resolution */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Resolution Choice *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setResolution("refund")}
                    className={`p-3 rounded-2xl border text-left cursor-pointer transition-all ${
                      resolution === "refund"
                        ? "border-[var(--primary)] bg-[var(--canvas)] font-bold text-gray-900"
                        : "border-gray-200 text-gray-600"
                    }`}
                  >
                    <span className="block text-xs font-bold">Refund</span>
                    <span className="block text-[11px] text-gray-500 mt-0.5">
                      Back to original payment rail
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setResolution("replacement")}
                    className={`p-3 rounded-2xl border text-left cursor-pointer transition-all ${
                      resolution === "replacement"
                        ? "border-[var(--primary)] bg-[var(--canvas)] font-bold text-gray-900"
                        : "border-gray-200 text-gray-600"
                    }`}
                  >
                    <span className="block text-xs font-bold">Replacement</span>
                    <span className="block text-[11px] text-gray-500 mt-0.5">
                      Merchant ships fresh item
                    </span>
                  </button>
                </div>
              </div>

              {/* Reason code */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Reason for Return *
                </label>
                <select
                  value={reasonCode}
                  onChange={(e) => setReasonCode(e.target.value as ReturnReasonCode)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold"
                >
                  {Object.entries(REASON_LABELS).map(([code, label]) => (
                    <option key={code} value={code}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Quantity to Return (Max {order.quantity}) *
                </label>
                <input
                  type="number"
                  min={1}
                  max={order.quantity}
                  value={returnQty}
                  onChange={(e) => setReturnQty(Math.min(order.quantity, Math.max(1, Number(e.target.value))))}
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold"
                />
              </div>

              {/* Reason Explanation */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Detailed Explanation (Optional)
                </label>
                <textarea
                  rows={3}
                  value={reasonText}
                  onChange={(e) => setReasonText(e.target.value)}
                  placeholder="Explain any defects or packaging condition upon arrival..."
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs"
                />
              </div>

              {/* Photo Evidence Attachments (1 to 5) */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Photo Evidence (1–5 photos required) *
                </label>
                <p className="text-[11px] text-gray-500 mb-2">
                  Attach clear photos showing damage, defect, or incorrect label.
                </p>

                <div className="flex flex-wrap gap-2 mb-2">
                  {evidenceFiles.map((file, idx) => (
                    <div
                      key={idx}
                      className="relative w-16 h-16 rounded-xl border border-gray-200 overflow-hidden bg-gray-100 flex items-center justify-center text-[10px] text-gray-600 font-bold p-1 text-center"
                    >
                      <span>{file.name.slice(0, 8)}...</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveEvidence(idx)}
                        className="absolute top-0.5 right-0.5 bg-black/60 text-white rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}

                  {evidenceFiles.length < 5 && (
                    <label className="w-16 h-16 rounded-xl border-2 border-dashed border-gray-300 hover:border-[var(--primary)] flex flex-col items-center justify-center cursor-pointer text-gray-400 hover:text-[var(--primary)] transition-colors">
                      <Upload className="w-5 h-5" />
                      <span className="text-[9px] font-bold mt-0.5">Upload</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleEvidenceFileChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowReturnModal(false)}
                  className="px-4 py-2 rounded-full border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReturn}
                  className="px-6 py-2.5 rounded-full shopcart-btn-primary text-xs font-bold disabled:opacity-50 flex items-center gap-2 cursor-pointer shadow-sm"
                >
                  {submittingReturn && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Submit Return Request</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Escalate Modal */}
      {showEscalateModal && activeReturn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-purple-600" />
                <h3 className="font-bold text-base text-gray-900">Escalate to Admin Mediation</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowEscalateModal(false)}
                className="p-1 rounded-full text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-gray-600">
              If the seller rejected your valid return claim, submit your dispute statement for platform admin review.
            </p>

            <textarea
              rows={4}
              value={escalateNote}
              onChange={(e) => setEscalateNote(e.target.value)}
              placeholder="State why the seller rejection is unwarranted..."
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs"
            />

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowEscalateModal(false)}
                className="px-4 py-2 rounded-full border border-gray-200 text-xs font-semibold text-gray-600"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={escalating}
                onClick={() => handleEscalateReturn(activeReturn.id)}
                className="px-6 py-2.5 rounded-full bg-purple-600 text-white text-xs font-bold hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2 shadow-sm"
              >
                {escalating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Escalate Dispute</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
