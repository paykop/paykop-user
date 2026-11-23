"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, Loader2, Plus, Trash2, Wrench } from "lucide-react";
import { api } from "@/lib/api/endpoints";
import { session } from "@/lib/auth/session";
import { ServiceCategory, ServiceItem } from "@/types";
import { formatPaise, rupeesToPaise } from "@/lib/money";
import { uploadViaPresignedUrl } from "@/lib/upload/presignedUpload";
import { isKycVerified, KYC_REQUIRED_LISTING_MSG } from "@/lib/kyc";
import { toast } from "@/lib/toast";

export default function SellerServicesPage() {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [kycStatus, setKycStatus] = useState<string | undefined>();
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [feesRupees, setFeesRupees] = useState("");
  const [categoryId, setCategoryId] = useState(1);
  const [address, setAddress] = useState("");
  const [scheduleInfo, setScheduleInfo] = useState("Mon–Sat 9am–6pm");
  const [imageFile, setImageFile] = useState<File | null>(null);

  const canAdd = isKycVerified(kycStatus);

  const load = () =>
    Promise.all([
      api.auth.getMe(),
      api.seller.listServiceCategories().catch(() => []),
      api.services.list().catch(() => []),
    ])
      .then(([me, cats, allServices]) => {
        setKycStatus(me.kyc_status);
        setCategories(Array.isArray(cats) ? cats : []);
        const list = Array.isArray(allServices) ? allServices : [];
        setServices(list.filter((s) => s.provider_id === me.id));
        if (cats[0]?.id) setCategoryId(cats[0].id);
      })
      .finally(() => setLoading(false));

  useEffect(() => {
    if (!session.isAuthenticated()) return;
    load();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canAdd) {
      toast.error(KYC_REQUIRED_LISTING_MSG);
      return;
    }
    setSaving(true);
    try {
      let images: string[] | undefined;
      if (imageFile) {
        const { publicUrl } = await uploadViaPresignedUrl(imageFile, "product");
        images = [publicUrl];
      }
      await api.provider.createService({
        category_id: categoryId,
        title: title.trim(),
        description: description.trim(),
        fees: rupeesToPaise(Number(feesRupees)),
        schedule_info: scheduleInfo,
        operating_hours: scheduleInfo,
        address: address.trim(),
        images,
      });
      toast.success("Service created");
      setShowModal(false);
      setTitle("");
      setDescription("");
      setFeesRupees("");
      setImageFile(null);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create service");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this service?")) return;
    try {
      await api.provider.deleteService(id);
      toast.success("Service deleted");
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center">
        <Loader2 className="w-8 h-8 text-[var(--primary)] animate-spin mx-auto" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <nav className="flex items-center gap-2 text-xs text-gray-500">
        <Link href="/seller" className="hover:text-gray-900">
          Seller Hub
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="font-semibold text-gray-900">Services</span>
      </nav>

      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
          <Wrench className="w-6 h-6 text-[var(--primary)]" /> My Services
        </h1>
        <button
          type="button"
          onClick={() => (canAdd ? setShowModal(true) : toast.error(KYC_REQUIRED_LISTING_MSG))}
          className="px-4 py-2 rounded-full shopcart-btn-primary text-xs font-bold flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Add service
        </button>
      </div>

      {!canAdd && (
        <p className="text-xs text-amber-700 bg-amber-50 p-3 rounded-xl border border-amber-100">
          {KYC_REQUIRED_LISTING_MSG}{" "}
          <Link href="/seller/kyc" className="font-bold underline">
            Complete KYC
          </Link>
        </p>
      )}

      {services.length === 0 ? (
        <p className="text-sm text-gray-500 py-12 text-center">No services listed yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {services.map((svc) => (
            <div key={svc.id} className="shopcart-card p-5 bg-white flex justify-between gap-3">
              <div>
                <h3 className="font-bold text-gray-900">{svc.title}</h3>
                <p className="text-xs text-gray-500 mt-1">{svc.category?.name}</p>
                <p className="text-sm font-bold text-[var(--primary)] mt-2">{formatPaise(svc.fees)}</p>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(svc.id)}
                className="p-2 text-red-500 hover:bg-red-50 rounded-lg cursor-pointer self-start"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <form
            onSubmit={handleCreate}
            className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <h2 className="font-bold text-lg">New service</h2>
            <input
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm"
              required
            />
            <textarea
              placeholder="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm"
              rows={2}
            />
            <input
              placeholder="Fees (₹)"
              type="number"
              value={feesRupees}
              onChange={(e) => setFeesRupees(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm"
              required
            />
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <input
              placeholder="Service address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm"
              required
            />
            <input
              placeholder="Schedule / hours"
              value={scheduleInfo}
              onChange={(e) => setScheduleInfo(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm"
            />
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
              className="text-xs"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="flex-1 py-2 rounded-xl border border-gray-200 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 py-2 rounded-xl shopcart-btn-primary text-xs font-bold disabled:opacity-50 cursor-pointer"
              >
                {saving ? "Saving…" : "Create"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
