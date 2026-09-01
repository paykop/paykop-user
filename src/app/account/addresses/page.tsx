"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  MapPin,
  Plus,
  Trash2,
  Loader2,
  ChevronRight,
  Home,
  Building,
} from "lucide-react";
import { api } from "@/lib/api/endpoints";
import { session } from "@/lib/auth/session";
import { Address } from "@/types";
import { toast } from "@/lib/toast";
import { useLocationStore } from "@/lib/location/store";

export default function AddressesPage() {
  const { latitude, longitude, cityName } = useLocationStore();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  // Form State
  const [label, setLabel] = useState("Home");
  const [addressLine, setAddressLine] = useState("");
  const [landmark, setLandmark] = useState("");
  const [city, setCity] = useState(cityName || "Hyderabad");
  const [state] = useState("Telangana");
  const [pincode, setPincode] = useState("500001");
  const [isDefault, setIsDefault] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadAddresses = () =>
    api.addresses
      .list()
      .then((data) => setAddresses(Array.isArray(data) ? data : []))
      .catch(() => setAddresses([]))
      .finally(() => setLoading(false));

  const fetchAddresses = ({ showLoading = false }: { showLoading?: boolean } = {}) => {
    if (showLoading) setLoading(true);
    return loadAddresses();
  };

  useEffect(() => {
    if (!session.isAuthenticated()) return;
    loadAddresses();
  }, []);

  const handleCreateAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.addresses.create({
        label,
        address_line: addressLine,
        landmark: landmark || undefined,
        city,
        state,
        pincode,
        lat: latitude || 17.385,
        lng: longitude || 78.4867,
        is_default: isDefault,
      });
      setShowAddForm(false);
      setAddressLine("");
      setLandmark("");
      fetchAddresses({ showLoading: true });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to create address");
    } finally {
      setSaving(false);
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await api.addresses.setDefault(id);
      fetchAddresses({ showLoading: true });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to set default address");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this address?")) return;
    try {
      await api.addresses.delete(id);
      fetchAddresses({ showLoading: true });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to delete address");
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
          Account
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="font-semibold text-gray-900">Delivery Addresses</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">
            Saved Delivery Addresses
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Addresses for 2-hour hyperlocal deliveries and service appointments
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2.5 rounded-full shopcart-btn-primary text-xs font-bold flex items-center gap-1.5 self-start cursor-pointer shadow-sm"
        >
          <Plus className="w-4 h-4 text-[var(--accent-green)]" />
          <span>Add New Address</span>
        </button>
      </div>

      {/* Add Address Form */}
      {showAddForm && (
        <form
          onSubmit={handleCreateAddress}
          className="shopcart-card p-6 bg-white border border-[var(--primary)]/20 space-y-4 animate-fade-in"
        >
          <h3 className="font-bold text-sm text-gray-900">Add New Address</h3>

          <div className="flex items-center gap-2">
            {["Home", "Work", "Other"].map((lbl) => (
              <button
                key={lbl}
                type="button"
                onClick={() => setLabel(lbl)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  label === lbl
                    ? "bg-[var(--primary)] text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {lbl}
              </button>
            ))}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Flat / House / Street Address *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Flat 302, Green Valley Apartments, Road No 12"
              value={addressLine}
              onChange={(e) => setAddressLine(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Landmark (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Near Metro Station"
                value={landmark}
                onChange={(e) => setLandmark(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">City *</label>
              <input
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Pincode *</label>
              <input
                type="text"
                required
                maxLength={6}
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              className="rounded text-[var(--primary)]"
            />
            <span>Set as default delivery address</span>
          </label>

          <div className="flex items-center gap-2 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-full shopcart-btn-primary text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Save Address</span>
            </button>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 text-xs font-semibold text-gray-500 hover:text-gray-900"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Address List */}
      {loading ? (
        <div className="py-20 text-center">
          <Loader2 className="w-8 h-8 text-[var(--primary)] animate-spin mx-auto" />
          <p className="text-xs text-gray-500 mt-2">Loading addresses...</p>
        </div>
      ) : addresses.length === 0 ? (
        <div className="shopcart-card p-10 text-center bg-white space-y-3">
          <MapPin className="w-10 h-10 text-gray-300 mx-auto" />
          <h3 className="font-bold text-base text-gray-900">No saved addresses yet</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            Add your home or office address to enable quick 1-click single item checkouts.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className={`shopcart-card p-5 bg-white flex flex-col justify-between space-y-4 border ${
                addr.is_default ? "border-[var(--primary)] shadow-xs" : "border-gray-200"
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-gray-100 text-gray-700">
                      {addr.label === "Home" ? <Home className="w-3.5 h-3.5" /> : <Building className="w-3.5 h-3.5" />}
                    </span>
                    <span className="font-bold text-sm text-gray-900">{addr.label}</span>
                  </div>

                  {addr.is_default && (
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-extrabold uppercase">
                      Default
                    </span>
                  )}
                </div>

                <p className="text-xs text-gray-700 leading-relaxed font-medium">
                  {addr.address_line}
                  {addr.landmark && `, near ${addr.landmark}`}
                  <br />
                  {addr.city}, {addr.state} - {addr.pincode}
                </p>
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                {!addr.is_default ? (
                  <button
                    onClick={() => handleSetDefault(addr.id)}
                    className="text-xs font-bold text-[var(--primary)] hover:underline cursor-pointer"
                  >
                    Set as Default
                  </button>
                ) : (
                  <span className="text-[11px] text-gray-400 font-medium">Active Address</span>
                )}

                <button
                  onClick={() => handleDelete(addr.id)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                  title="Delete Address"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
