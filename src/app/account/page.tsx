"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Package,
  Heart,
  MapPin,
  Store,
  Edit2,
  Check,
  Loader2,
  Wrench,
  Briefcase,
} from "lucide-react";
import { api } from "@/lib/api/endpoints";
import { session } from "@/lib/auth/session";
import { User } from "@/types";

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(() => session.getUser());
  const [isEditing, setIsEditing] = useState(false);
  const [firstName, setFirstName] = useState(() => session.getUser()?.first_name || "");
  const [lastName, setLastName] = useState(() => session.getUser()?.last_name || "");
  const [address, setAddress] = useState(() => session.getUser()?.address || "");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (!session.isAuthenticated()) {
      router.push("/login");
      return;
    }

    api.auth
      .getMe()
      .then((data) => {
        setUser(data);
        setFirstName(data.first_name || "");
        setLastName(data.last_name || "");
        setAddress(data.address || "");
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [router]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg("");
    try {
      const updated = await api.users.updateProfile({
        first_name: firstName,
        last_name: lastName,
        address: address,
      });
      setUser(updated);
      session.setUser(updated);
      setIsEditing(false);
      setMsg("Profile updated successfully!");
      setTimeout(() => setMsg(""), 3000);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-[var(--primary)] animate-spin" />
        <p className="text-xs text-gray-500 mt-2">Loading account details...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header Profile Hero */}
      <div className="rounded-3xl bg-[var(--primary)] text-white p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-lg">
        <div className="flex items-center gap-4 text-center sm:text-left flex-col sm:flex-row">
          <div className="w-20 h-20 rounded-2xl bg-[var(--accent-green)] text-[var(--primary-dark)] font-black text-3xl flex items-center justify-center shadow-md">
            {user?.first_name ? user.first_name[0].toUpperCase() : "U"}
          </div>
          <div>
            <div className="flex items-center gap-2 justify-center sm:justify-start">
              <h1 className="text-2xl font-black">
                {user?.first_name} {user?.last_name}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-[var(--accent-green)] text-[10px] font-bold uppercase tracking-wider">
                {user?.role || "Buyer"}
              </span>
            </div>
            <p className="text-xs text-white/70 mt-1">{user?.phone || user?.email}</p>
          </div>
        </div>

        {user?.role === "agent" ? (
          <Link
            href="/agent"
            className="px-5 py-2.5 rounded-full bg-[var(--accent-green)] text-[var(--primary-dark)] font-bold text-xs flex items-center gap-2 shadow-sm"
          >
            <Briefcase className="w-4 h-4" />
            <span>Open Agent Portal</span>
          </Link>
        ) : user?.role === "seller" ? (
          <Link
            href="/seller"
            className="px-5 py-2.5 rounded-full bg-[var(--accent-green)] text-[var(--primary-dark)] font-bold text-xs flex items-center gap-2 shadow-sm"
          >
            <Store className="w-4 h-4" />
            <span>Open Seller Portal</span>
          </Link>
        ) : (
          <Link
            href="/seller"
            className="px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-2 border border-white/20 transition-colors"
          >
            <Store className="w-4 h-4 text-[var(--accent-green)]" />
            <span>Become a Seller</span>
          </Link>
        )}
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Link
          href="/account/orders"
          className="shopcart-card p-5 bg-white hover:border-[var(--primary)] transition-all space-y-2 group"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[var(--primary)] flex items-center justify-center group-hover:scale-105 transition-transform">
            <Package className="w-5 h-5" />
          </div>
          <div className="font-bold text-sm text-gray-900">My Orders</div>
          <div className="text-xs text-gray-400">Track shipments & OTPs</div>
        </Link>

        <Link
          href="/bookings"
          className="shopcart-card p-5 bg-white hover:border-[var(--primary)] transition-all space-y-2 group"
        >
          <div className="w-10 h-10 rounded-xl bg-[var(--primary-subtle)] text-[var(--primary)] flex items-center justify-center group-hover:scale-105 transition-transform">
            <Wrench className="w-5 h-5" />
          </div>
          <div className="font-bold text-sm text-gray-900">Service Bookings</div>
          <div className="text-xs text-gray-400">Manage appointments</div>
        </Link>

        <Link
          href="/account/wishlist"
          className="shopcart-card p-5 bg-white hover:border-[var(--primary)] transition-all space-y-2 group"
        >
          <div className="w-10 h-10 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center group-hover:scale-105 transition-transform">
            <Heart className="w-5 h-5" />
          </div>
          <div className="font-bold text-sm text-gray-900">Saved Wishlist</div>
          <div className="text-xs text-gray-400">Favorites & saved items</div>
        </Link>

        <Link
          href="/account/addresses"
          className="shopcart-card p-5 bg-white hover:border-[var(--primary)] transition-all space-y-2 group"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center group-hover:scale-105 transition-transform">
            <MapPin className="w-5 h-5" />
          </div>
          <div className="font-bold text-sm text-gray-900">Addresses</div>
          <div className="text-xs text-gray-400">Saved delivery locations</div>
        </Link>
      </div>

      {/* Profile Details & Form */}
      <div className="shopcart-card p-6 sm:p-8 bg-white space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Profile Information</h2>
            <p className="text-xs text-gray-500">Manage your name and primary contact details</p>
          </div>

          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 rounded-full shopcart-btn-outline text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit Profile</span>
            </button>
          ) : (
            <button
              onClick={() => setIsEditing(false)}
              className="text-xs font-semibold text-gray-500 hover:text-gray-900 cursor-pointer"
            >
              Cancel
            </button>
          )}
        </div>

        {msg && (
          <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-xl font-medium border border-emerald-200">
            {msg}
          </div>
        )}

        {isEditing ? (
          <form onSubmit={handleSaveProfile} className="space-y-4 max-w-xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">First Name</label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Last Name</label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Primary Address</label>
              <textarea
                rows={3}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 rounded-full shopcart-btn-primary text-xs font-bold flex items-center gap-2 cursor-pointer shadow-sm"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin text-[var(--accent-green)]" />
              ) : (
                <Check className="w-4 h-4 text-[var(--accent-green)]" />
              )}
              <span>Save Changes</span>
            </button>
          </form>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
            <div>
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">
                Full Name
              </span>
              <span className="font-bold text-gray-900">
                {user?.first_name} {user?.last_name}
              </span>
            </div>

            <div>
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">
                Phone Number
              </span>
              <span className="font-bold text-gray-900">{user?.phone || "Not set"}</span>
            </div>

            <div className="sm:col-span-2">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">
                Primary Delivery Address
              </span>
              <span className="font-medium text-gray-700">{user?.address || "Not set"}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
