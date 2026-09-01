"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, Loader2, Upload, ShieldCheck, AlertCircle } from "lucide-react";
import { api } from "@/lib/api/endpoints";
import { useCategories } from "@/lib/queries/hooks";
import { uploadViaPresignedUrl } from "@/lib/upload/presignedUpload";
import { KycDocumentInput, KycRequirement, KycSubmission } from "@/types";
import { kycStatusChipClass, kycStatusLabel } from "@/lib/kyc";
import { toast } from "@/lib/toast";

export default function SellerKycPage() {
  const { data: categories = [] } = useCategories();
  const [kyc, setKyc] = useState<KycSubmission | null>(null);
  const [requirements, setRequirements] = useState<KycRequirement[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);

  const [categoryKind, setCategoryKind] = useState("product");
  const [primaryCategoryId, setPrimaryCategoryId] = useState(1);
  const [gstin, setGstin] = useState("");
  const [pan, setPan] = useState("");
  const [documents, setDocuments] = useState<KycDocumentInput[]>([]);

  useEffect(() => {
    Promise.all([
      api.kyc.getMyKyc().catch(() => null),
    ])
      .then(([draft]) => {
        if (draft) {
          setKyc(draft);
          if (draft.category_kind) setCategoryKind(draft.category_kind);
          if (draft.primary_category_id) setPrimaryCategoryId(draft.primary_category_id);
          if (draft.gstin) setGstin(draft.gstin);
          if (draft.pan) setPan(draft.pan);
          if (draft.documents?.length) {
            setDocuments(
              draft.documents.map((d) => ({
                doc_type: d.doc_type,
                file_key: d.file_key,
                file_url: d.file_url,
                content_type: d.content_type,
              }))
            );
          }
        }
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!primaryCategoryId) return;
    api.kyc
      .getRequirements(categoryKind, primaryCategoryId)
      .then((res) => setRequirements(res.requirements || []))
      .catch(() => setRequirements([]));
  }, [categoryKind, primaryCategoryId]);

  const handleUpload = async (docType: string, file: File) => {
    setUploading(docType);
    try {
      const { publicUrl, key } = await uploadViaPresignedUrl(file, "kyc");
      setDocuments((prev) => {
        const filtered = prev.filter((d) => d.doc_type !== docType);
        return [
          ...filtered,
          {
            doc_type: docType,
            file_key: key,
            file_url: publicUrl,
            content_type: file.type,
          },
        ];
      });
      toast.success(`${docType} uploaded`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(null);
    }
  };

  const buildPayload = () => ({
    category_kind: categoryKind,
    primary_category_id: primaryCategoryId,
    gstin: gstin.trim() || undefined,
    pan: pan.trim() || undefined,
    documents,
  });

  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      const updated = await api.kyc.upsertDraft(buildPayload());
      setKyc(updated);
      toast.success("Draft saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save draft");
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      await api.kyc.upsertDraft(buildPayload());
      const submitted = await api.kyc.submit();
      setKyc(submitted);
      toast.success("KYC submitted for review");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit KYC");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center">
        <Loader2 className="w-8 h-8 text-[var(--primary)] animate-spin mx-auto" />
      </div>
    );
  }

  const status = kyc?.status ?? "unverified";

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <nav className="flex items-center gap-2 text-xs text-gray-500 flex-wrap">
        <Link href="/seller" className="hover:text-gray-900">
          Seller Hub
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="font-semibold text-gray-900">KYC Verification</span>
      </nav>

      <div className="flex items-center gap-3">
        <ShieldCheck className="w-8 h-8 text-[var(--primary)]" />
        <div>
          <h1 className="text-2xl font-black text-gray-900">Seller KYC</h1>
          <span className={`inline-flex mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${kycStatusChipClass(status)}`}>
            {kycStatusLabel(status)}
          </span>
        </div>
      </div>

      {kyc?.rejection_reason && (
        <div className="text-xs text-red-600 bg-red-50 p-3 rounded-xl border border-red-100 flex gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>Rejected: {kyc.rejection_reason}</span>
        </div>
      )}

      {status === "verified" ? (
        <div className="shopcart-card p-6 bg-emerald-50 text-emerald-800 text-sm">
          Your KYC is verified. You can list products and services from the seller hub.
        </div>
      ) : (
        <div className="shopcart-card p-6 bg-white space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Category kind</label>
              <select
                value={categoryKind}
                onChange={(e) => setCategoryKind(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm"
              >
                <option value="product">Product seller</option>
                <option value="service">Service provider</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Primary category</label>
              <select
                value={primaryCategoryId}
                onChange={(e) => setPrimaryCategoryId(Number(e.target.value))}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">GSTIN (optional)</label>
              <input
                value={gstin}
                onChange={(e) => setGstin(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">PAN (optional)</label>
              <input
                value={pan}
                onChange={(e) => setPan(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm"
              />
            </div>
          </div>

          <div className="space-y-3 pt-2 border-t border-gray-100">
            <h2 className="font-bold text-sm text-gray-900">Documents</h2>
            {requirements.length === 0 ? (
              <p className="text-xs text-gray-500">Select a category to see required documents.</p>
            ) : (
              requirements.map((req) => {
                const uploaded = documents.find((d) => d.doc_type === req.doc_type);
                return (
                  <div
                    key={req.doc_type}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-gray-50"
                  >
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {req.label}{" "}
                        {req.required && <span className="text-red-500">*</span>}
                      </p>
                      {uploaded && (
                        <p className="text-[10px] text-emerald-600 mt-0.5">Uploaded</p>
                      )}
                    </div>
                    <label className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white border border-gray-200 text-xs font-bold cursor-pointer">
                      <Upload className="w-3.5 h-3.5" />
                      {uploading === req.doc_type ? "Uploading…" : "Upload file"}
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        className="hidden"
                        disabled={!!uploading}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) void handleUpload(req.doc_type, file);
                        }}
                      />
                    </label>
                  </div>
                );
              })
            )}
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={saving}
              className="px-5 py-2.5 rounded-full bg-gray-900 text-white text-xs font-bold disabled:opacity-50 cursor-pointer"
            >
              Save draft
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving || status === "pending"}
              className="px-5 py-2.5 rounded-full shopcart-btn-primary text-xs font-bold disabled:opacity-50 cursor-pointer"
            >
              Submit for review
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
