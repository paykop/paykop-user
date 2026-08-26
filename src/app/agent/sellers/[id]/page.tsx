"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ChevronRight,
  Loader2,
  MapPin,
  Package,
  Sparkles,
  Wrench,
  CheckCircle2,
} from "lucide-react";
import { api } from "@/lib/api/endpoints";
import { useLocationStore } from "@/lib/location/store";
import { AgentSellerSummary } from "@/types";
import { AgentGate } from "@/components/agent/AgentGate";
import { kycStatusChipClass, kycStatusLabel } from "@/lib/kyc";

function SellerDetailContent() {
  const params = useParams();
  const sellerId = params.id as string;
  const { latitude, longitude, cityName, formattedAddress } = useLocationStore();

  const [seller, setSeller] = useState<AgentSellerSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [bio, setBio] = useState("");

  const [bizLat, setBizLat] = useState("");
  const [bizLng, setBizLng] = useState("");
  const [bizAddress, setBizAddress] = useState("");
  const [bizCity, setBizCity] = useState("");
  const [bizState, setBizState] = useState("");
  const [bizPostal, setBizPostal] = useState("");

  const loadSeller = () =>
    api.agent
      .getSeller(sellerId)
      .then((data) => {
        setSeller(data);
        setFirstName(data.first_name || "");
        setLastName(data.last_name || "");
        setPhone((data.phone || "").replace(/^\+91/, ""));
        setEmail(data.email || "");
        setAddress(data.address || "");
      })
      .catch(() => setSeller(null))
      .finally(() => setLoading(false));

  const load = ({ showLoading = false }: { showLoading?: boolean } = {}) => {
    if (showLoading) setLoading(true);
    return loadSeller();
  };

  useEffect(() => {
    loadSeller();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sellerId]);

  const flash = (text: string) => {
    setMsg(text);
    setTimeout(() => setMsg(""), 3000);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg("");
    try {
      const updated = await api.agent.updateSellerProfile(sellerId, {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone: phone.replace(/\D/g, "").length === 10 ? `+91${phone.replace(/\D/g, "")}` : phone,
        email: email.trim() || undefined,
        address: address.trim(),
        bio: bio.trim() || undefined,
      });
      setSeller(updated);
      flash("Profile updated");
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleSetCurrentLocation = async () => {
    if (latitude == null || longitude == null) {
      setErrorMsg("Set your location in the header first, then apply it to this seller.");
      return;
    }
    setSaving(true);
    setErrorMsg("");
    try {
      await api.agent.updateSellerLocation(sellerId, {
        latitude,
        longitude,
        city: cityName,
        address: formattedAddress,
        formatted_address: formattedAddress,
      });
      flash("Seller current location updated");
      load({ showLoading: true });
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to update location");
    } finally {
      setSaving(false);
    }
  };

  const handleBusinessLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    const lat = Number(bizLat);
    const lng = Number(bizLng);
    if (!bizAddress.trim() || Number.isNaN(lat) || Number.isNaN(lng)) {
      setErrorMsg("Business address, latitude, and longitude are required.");
      return;
    }
    setSaving(true);
    setErrorMsg("");
    try {
      await api.agent.updateSellerBusinessLocation(sellerId, {
        latitude: lat,
        longitude: lng,
        address: bizAddress.trim(),
        city: bizCity.trim() || undefined,
        state: bizState.trim() || undefined,
        postal_code: bizPostal.trim() || undefined,
        location_enabled: true,
      });
      flash("Business location saved");
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to save business location");
    } finally {
      setSaving(false);
    }
  };

  const fillBizFromStore = () => {
    if (latitude != null) setBizLat(String(latitude));
    if (longitude != null) setBizLng(String(longitude));
    if (formattedAddress) setBizAddress(formattedAddress);
    if (cityName) setBizCity(cityName);
  };

  const handleGrantTrial = async () => {
    if (!confirm("Grant a subscription trial to this seller?")) return;
    setSaving(true);
    setErrorMsg("");
    try {
      const res = await api.agent.grantTrial(sellerId);
      flash(`Trial granted (${res.plan}) until ${res.expires_at || "n/a"}`);
      load({ showLoading: true });
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to grant trial");
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

  if (!seller) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center space-y-3">
        <h2 className="text-xl font-black text-gray-900">Seller not found</h2>
        <Link href="/agent/sellers" className="text-sm font-bold text-[var(--primary)]">
          Back to sellers
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <nav className="flex items-center gap-2 text-xs text-gray-500 flex-wrap">
        <Link href="/" className="hover:text-gray-900">
          Home
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href="/agent" className="hover:text-gray-900">
          Agent Hub
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href="/agent/sellers" className="hover:text-gray-900">
          Sellers
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="font-semibold text-gray-900 truncate">
          {seller.first_name} {seller.last_name}
        </span>
      </nav>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="min-w-0 space-y-2">
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            {seller.first_name} {seller.last_name}
          </h1>
          <p className="text-sm text-gray-500">{seller.phone || seller.email}</p>
          <div className="flex flex-wrap gap-2">
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${kycStatusChipClass(
                seller.kyc_status
              )}`}
            >
              KYC: {kycStatusLabel(seller.kyc_status)}
            </span>
          </div>
          <p className="text-[11px] text-gray-500 max-w-xl">
            Trial listings do not require KYC. Seller must verify KYC before self-serve publish.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/agent/sellers/${sellerId}/products`}
            className="px-4 py-2 rounded-full shopcart-btn-primary text-xs font-bold flex items-center gap-1.5"
          >
            <Package className="w-3.5 h-3.5" /> Add product
          </Link>
          <Link
            href={`/agent/sellers/${sellerId}/services`}
            className="px-4 py-2 rounded-full bg-white border border-gray-200 text-xs font-bold flex items-center gap-1.5"
          >
            <Wrench className="w-3.5 h-3.5" /> Add service
          </Link>
        </div>
      </div>

      {msg && (
        <div className="text-xs text-emerald-700 bg-emerald-50 p-3 rounded-xl border border-emerald-100 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> {msg}
        </div>
      )}
      {errorMsg && (
        <div className="text-xs text-red-600 bg-red-50 p-3 rounded-xl border border-red-100">{errorMsg}</div>
      )}

      <div className="shopcart-card p-6 bg-white space-y-4">
        <h2 className="font-bold text-gray-900">Profile</h2>
        <form onSubmit={handleSaveProfile} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">First name</label>
            <input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Last name</label>
            <input
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Phone</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-gray-600 mb-1">Address</label>
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm"
              required
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-gray-600 mb-1">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={2}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm"
            />
          </div>
          <div>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-full shopcart-btn-primary text-xs font-bold disabled:opacity-50 cursor-pointer"
            >
              Save profile
            </button>
          </div>
        </form>
      </div>

      <div className="shopcart-card p-6 bg-white space-y-4">
        <h2 className="font-bold text-gray-900 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-[var(--primary)]" /> Current location
        </h2>
        <p className="text-xs text-gray-500">
          Applies your selected app location ({cityName}) to this seller&apos;s current location.
        </p>
        <button
          onClick={handleSetCurrentLocation}
          disabled={saving}
          className="px-5 py-2.5 rounded-full bg-gray-900 text-white text-xs font-bold disabled:opacity-50 cursor-pointer"
        >
          Use my location for seller
        </button>
      </div>

      <div className="shopcart-card p-6 bg-white space-y-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-bold text-gray-900">Business location</h2>
          <button
            type="button"
            onClick={fillBizFromStore}
            className="text-xs font-bold text-[var(--primary)] cursor-pointer"
          >
            Fill from my location
          </button>
        </div>
        <form onSubmit={handleBusinessLocation} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Latitude</label>
            <input
              value={bizLat}
              onChange={(e) => setBizLat(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Longitude</label>
            <input
              value={bizLng}
              onChange={(e) => setBizLng(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm"
              required
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-gray-600 mb-1">Address</label>
            <input
              value={bizAddress}
              onChange={(e) => setBizAddress(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">City</label>
            <input
              value={bizCity}
              onChange={(e) => setBizCity(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">State</label>
            <input
              value={bizState}
              onChange={(e) => setBizState(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Postal code</label>
            <input
              value={bizPostal}
              onChange={(e) => setBizPostal(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm"
            />
          </div>
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-full shopcart-btn-primary text-xs font-bold disabled:opacity-50 cursor-pointer"
            >
              Save business location
            </button>
          </div>
        </form>
      </div>

      <div className="shopcart-card p-6 bg-white space-y-3">
        <h2 className="font-bold text-gray-900 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[var(--accent-green)]" /> Subscription trial
        </h2>
        <p className="text-xs text-gray-500">
          {seller.has_subscription
            ? "This seller already has an active subscription or trial."
            : "Grant a trial so the seller can list products and services."}
        </p>
        <button
          onClick={handleGrantTrial}
          disabled={saving || seller.has_subscription}
          className="px-5 py-2.5 rounded-full shopcart-btn-primary text-xs font-bold disabled:opacity-50 cursor-pointer"
        >
          Grant trial
        </button>
      </div>
    </div>
  );
}

export default function AgentSellerDetailPage() {
  return (
    <AgentGate>
      <SellerDetailContent />
    </AgentGate>
  );
}
