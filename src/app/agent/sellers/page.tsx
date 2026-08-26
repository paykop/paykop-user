"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronRight, Loader2, Plus, Users, X } from "lucide-react";
import { api } from "@/lib/api/endpoints";
import { AgentSellerSummary } from "@/types";
import { AgentGate } from "@/components/agent/AgentGate";
import { kycStatusChipClass, kycStatusLabel } from "@/lib/kyc";

function SellersContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [sellers, setSellers] = useState<AgentSellerSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(searchParams.get("new") === "1");
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");

  const loadSellers = () =>
    api.agent
      .listSellers()
      .then((res) => setSellers(res.sellers || []))
      .catch(() => setSellers([]))
      .finally(() => setLoading(false));

  const fetchSellers = ({ showLoading = false }: { showLoading?: boolean } = {}) => {
    if (showLoading) setLoading(true);
    return loadSellers();
  };

  useEffect(() => {
    loadSellers();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || phone.replace(/\D/g, "").length < 10) {
      setErrorMsg("First name, last name, and a valid phone are required.");
      return;
    }
    setSaving(true);
    setErrorMsg("");
    try {
      const created = await api.agent.createSeller({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone: `+91${phone.replace(/\D/g, "").slice(-10)}`,
        email: email.trim() || undefined,
        address: address.trim() || undefined,
      });
      setShowForm(false);
      setFirstName("");
      setLastName("");
      setPhone("");
      setEmail("");
      setAddress("");
      fetchSellers({ showLoading: true });
      router.push(`/agent/sellers/${created.id}`);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to create seller");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <nav className="flex items-center gap-2 text-xs text-gray-500">
        <Link href="/" className="hover:text-gray-900">
          Home
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href="/agent" className="hover:text-gray-900">
          Agent Hub
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="font-semibold text-gray-900">Managed Sellers</span>
      </nav>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">Managed sellers</h1>
          <p className="text-sm text-gray-500 mt-1">Sellers you created or were assigned to manage.</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-5 py-2.5 rounded-full shopcart-btn-primary text-xs font-bold flex items-center gap-2 cursor-pointer self-start"
        >
          <Plus className="w-4 h-4" />
          Create seller
        </button>
      </div>

      {showForm && (
        <div className="shopcart-card p-6 bg-white space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-gray-900">New seller</h2>
            <button onClick={() => setShowForm(false)} className="p-1 text-gray-400 hover:text-gray-700 cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>
          {errorMsg && (
            <div className="text-xs text-red-600 bg-red-50 p-3 rounded-xl border border-red-100">{errorMsg}</div>
          )}
          <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              <div className="flex rounded-xl border border-gray-200 overflow-hidden">
                <span className="px-3 py-2.5 bg-gray-50 text-xs font-semibold border-r border-gray-200">+91</span>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  className="w-full px-3 py-2.5 text-sm"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Email (optional)</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-600 mb-1">Address (optional)</label>
              <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm"
              />
            </div>
            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 rounded-full shopcart-btn-primary text-xs font-bold disabled:opacity-50 cursor-pointer"
              >
                {saving ? "Creating..." : "Create seller"}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="py-16 text-center">
          <Loader2 className="w-8 h-8 text-[var(--primary)] animate-spin mx-auto" />
        </div>
      ) : sellers.length === 0 ? (
        <div className="shopcart-card p-12 text-center bg-white space-y-3">
          <Users className="w-10 h-10 text-gray-300 mx-auto" />
          <h3 className="font-bold text-gray-900">No sellers yet</h3>
          <p className="text-sm text-gray-500">Create a seller to start onboarding inventory and services.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sellers.map((seller) => (
            <Link
              key={seller.id}
              href={`/agent/sellers/${seller.id}`}
              className="shopcart-card p-5 bg-white hover:border-[var(--primary)] transition-all space-y-2"
            >
              <div className="font-bold text-gray-900">
                {seller.first_name} {seller.last_name}
              </div>
              <div className="text-xs text-gray-500">{seller.phone || "No phone"}</div>
              <div className="flex flex-wrap gap-2 pt-1">
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    seller.is_onboarded ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                  }`}
                >
                  {seller.is_onboarded ? "Onboarded" : "Needs profile"}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    seller.has_subscription ? "bg-blue-50 text-blue-700" : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {seller.has_subscription ? "Subscribed" : "No plan"}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${kycStatusChipClass(
                    seller.kyc_status
                  )}`}
                >
                  KYC: {kycStatusLabel(seller.kyc_status)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AgentSellersPage() {
  return (
    <AgentGate>
      <Suspense fallback={<div className="py-20 text-center text-xs text-slate-400">Loading...</div>}>
        <SellersContent />
      </Suspense>
    </AgentGate>
  );
}
