"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, Loader2, MapPin } from "lucide-react";
import { api } from "@/lib/api/endpoints";
import { session } from "@/lib/auth/session";
import { toast } from "@/lib/toast";

export default function SellerLocationPage() {
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session.isAuthenticated()) {
      setLoading(false);
      return;
    }
    api.auth
      .getMe()
      .then((me) => {
        if (me.address) setAddress(me.address);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.trim()) {
      toast.error("Business address is required");
      return;
    }
    setSaving(true);
    try {
      const lat = latitude.trim() ? parseFloat(latitude) : undefined;
      const lng = longitude.trim() ? parseFloat(longitude) : undefined;
      await api.sellers.setBusinessLocation({
        address: address.trim(),
        city: city.trim() || undefined,
        state: state.trim() || undefined,
        postal_code: postalCode.trim() || undefined,
        latitude: lat,
        longitude: lng,
        location_enabled: true,
      });
      toast.success("Business location saved");
      const [me] = await Promise.all([
        api.auth.getMe(),
        api.sellers.getReadiness().catch(() => null),
      ]);
      session.setUser(me);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save location");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8 space-y-6">
      <nav className="flex items-center gap-2 text-xs text-gray-500">
        <Link href="/seller" className="hover:text-gray-900">Seller Hub</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="font-semibold text-gray-900">Business location</span>
      </nav>

      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-[var(--primary-subtle)] text-[var(--primary)] flex items-center justify-center">
          <MapPin className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl font-black text-gray-900">Business location</h1>
          <p className="text-xs text-gray-500">Required before your store is fully ready. Listings go live without admin approval.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
        <div>
          <label className="text-xs font-bold text-gray-600">Address *</label>
          <textarea
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
            rows={3}
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold text-gray-600">City</label>
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-600">State</label>
            <input
              value={state}
              onChange={(e) => setState(e.target.value)}
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
            />
          </div>
        </div>
        <div>
          <label className="text-xs font-bold text-gray-600">Postal code</label>
          <input
            value={postalCode}
            onChange={(e) => setPostalCode(e.target.value)}
            className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold text-gray-600">Latitude (optional)</label>
            <input
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
              placeholder="GPS"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-600">Longitude (optional)</label>
            <input
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="w-full py-3 rounded-full shopcart-btn-primary text-xs font-bold disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save location"}
        </button>
      </form>
    </div>
  );
}
