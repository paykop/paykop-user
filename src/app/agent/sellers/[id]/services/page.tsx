"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ChevronRight, Loader2, Wrench } from "lucide-react";
import { api } from "@/lib/api/endpoints";
import { ServiceCategory } from "@/types";
import { useLocationStore } from "@/lib/location/store";
import { rupeesToPaise } from "@/lib/money";
import { uploadViaPresignedUrl } from "@/lib/upload/presignedUpload";
import { AgentGate } from "@/components/agent/AgentGate";
import { listingsBlockReason } from "@/lib/agent/onboarding";

function CreateServiceContent() {
  const params = useParams();
  const router = useRouter();
  const sellerId = params.id as string;
  const { latitude, longitude, formattedAddress } = useLocationStore();

  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [loadingCats, setLoadingCats] = useState(true);
  const [gateLoading, setGateLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [feesRupees, setFeesRupees] = useState("");
  const [categoryId, setCategoryId] = useState<number>(0);
  const [address, setAddress] = useState(formattedAddress || "");
  const [lat, setLat] = useState(latitude != null ? String(latitude) : "");
  const [lng, setLng] = useState(longitude != null ? String(longitude) : "");
  const [scheduleInfo, setScheduleInfo] = useState(
    JSON.stringify({ mon: "9:00-18:00", tue: "9:00-18:00", wed: "9:00-18:00", thu: "9:00-18:00", fri: "9:00-18:00" })
  );
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const seller =
          (await api.agent.getOnboardingStatus(sellerId).catch(() => null)) ??
          (await api.agent.getSeller(sellerId));
        const reason = listingsBlockReason(seller);
        if (reason) {
          router.replace(`/agent/sellers/${sellerId}`);
          return;
        }
      } catch {
        router.replace(`/agent/sellers/${sellerId}`);
        return;
      } finally {
        if (!cancelled) setGateLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sellerId, router]);

  useEffect(() => {
    api.agent
      .getSellerServiceCategories(sellerId)
      .then((res) => {
        const list = res.categories || [];
        setCategories(list);
        if (list[0]?.id) setCategoryId(list[0].id);
      })
      .catch(() => {
        api.services
          .listCategories()
          .then((data) => {
            const list = Array.isArray(data) ? data : [];
            setCategories(list);
            if (list[0]?.id) setCategoryId(list[0].id);
          })
          .catch(() => setCategories([]));
      })
      .finally(() => setLoadingCats(false));
  }, [sellerId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !feesRupees || !categoryId || !address.trim()) {
      setErrorMsg("Title, fees, category, and address are required.");
      return;
    }
    try {
      JSON.parse(scheduleInfo);
    } catch {
      setErrorMsg("Schedule info must be valid JSON.");
      return;
    }

    setSaving(true);
    setErrorMsg("");
    try {
      const latNum = lat ? Number(lat) : undefined;
      const lngNum = lng ? Number(lng) : undefined;
      let images: string[] | undefined;
      if (imageFile) {
        const { publicUrl } = await uploadViaPresignedUrl(imageFile, "product");
        images = [publicUrl];
      } else if (imageUrl.trim()) {
        images = [imageUrl.trim()];
      }
      await api.agent.createService(sellerId, {
        category_id: categoryId,
        title: title.trim(),
        description: description.trim(),
        fees: rupeesToPaise(Number(feesRupees)),
        schedule_info: scheduleInfo,
        address: address.trim(),
        latitude: latNum != null && !Number.isNaN(latNum) ? latNum : undefined,
        longitude: lngNum != null && !Number.isNaN(lngNum) ? lngNum : undefined,
        images,
      });
      router.push(`/agent/sellers/${sellerId}`);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to create service");
    } finally {
      setSaving(false);
    }
  };

  if (gateLoading) {
    return (
      <div className="py-20 text-center">
        <Loader2 className="w-8 h-8 text-[var(--primary)] animate-spin mx-auto" />
        <p className="text-xs text-gray-500 mt-2">Checking onboarding…</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <nav className="flex items-center gap-2 text-xs text-gray-500 flex-wrap">
        <Link href="/agent" className="hover:text-gray-900">
          Agent Hub
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href={`/agent/sellers/${sellerId}`} className="hover:text-gray-900">
          Seller
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="font-semibold text-gray-900">Add service</span>
      </nav>

      <div className="flex items-center gap-2">
        <Wrench className="w-5 h-5 text-[var(--primary)]" />
        <h1 className="text-2xl font-black text-gray-900 tracking-tight">Create service for seller</h1>
      </div>

      {errorMsg && (
        <div className="text-xs text-red-600 bg-red-50 p-3 rounded-xl border border-red-100">{errorMsg}</div>
      )}

      {loadingCats ? (
        <div className="py-12 text-center">
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-[var(--primary)]" />
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="shopcart-card p-6 bg-white space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Base fee (₹)</label>
              <input
                type="number"
                min="1"
                step="0.01"
                value={feesRupees}
                onChange={(e) => setFeesRupees(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Category</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(Number(e.target.value))}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm"
                required
              >
                {categories.length === 0 && <option value={0}>No categories</option>}
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Address</label>
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm"
              required
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Latitude</label>
              <input
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Longitude</label>
              <input
                value={lng}
                onChange={(e) => setLng(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Schedule info (JSON)</label>
            <textarea
              value={scheduleInfo}
              onChange={(e) => setScheduleInfo(e.target.value)}
              rows={3}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm font-mono"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Service image (optional)</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
              className="w-full text-xs"
            />
            <input
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="Or image URL"
              className="w-full mt-2 px-3 py-2.5 rounded-xl border border-gray-200 text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={saving || !categoryId}
            className="px-6 py-3 rounded-full shopcart-btn-primary text-xs font-bold disabled:opacity-50 cursor-pointer"
          >
            {saving ? "Creating..." : "Create service"}
          </button>
        </form>
      )}
    </div>
  );
}

export default function AgentCreateServicePage() {
  return (
    <AgentGate>
      <CreateServiceContent />
    </AgentGate>
  );
}
