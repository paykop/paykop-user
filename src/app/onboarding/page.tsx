"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle2, ShieldCheck } from "lucide-react";
import { api } from "@/lib/api/endpoints";
import { session } from "@/lib/auth/session";

export default function OnboardingPage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState(() => session.getUser()?.first_name || "");
  const [lastName, setLastName] = useState(() => session.getUser()?.last_name || "");
  const [phone, setPhone] = useState(() => {
    const p = session.getUser()?.phone;
    return p ? p.replace("+91", "") : "";
  });
  const [address, setAddress] = useState(() => session.getUser()?.address || "");
  const [bio, setBio] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!session.isAuthenticated()) {
      router.push("/login");
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!firstName.trim() || !lastName.trim() || !address.trim() || phone.length < 10) {
      setErrorMsg("Please fill in all required fields (First name, Last name, Phone, and Address).");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    const formattedPhone = phone.startsWith("+91") ? phone : `+91${phone.replace(/\D/g, "")}`;

    try {
      const updatedUser = await api.users.onboarding({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone: formattedPhone,
        address: address.trim(),
        bio: bio.trim(),
      });

      session.setUser(updatedUser);
      router.push("/");
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to complete onboarding. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4 py-12">
      <div className="bg-white w-full max-w-xl max-h-[90dvh] overflow-y-auto rounded-3xl shadow-xl border border-gray-100 p-6 sm:p-8 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Profile Verification</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            Complete Your Profile
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 max-w-md mx-auto">
            To ensure secure 2-hour deliveries, please complete your delivery details once.
          </p>
        </div>

        {errorMsg && (
          <div className="text-xs text-red-600 bg-red-50 p-3 rounded-xl border border-red-100 text-center">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                First Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Rahul"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm text-gray-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Last Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Verma"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm text-gray-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              Contact Phone *
            </label>
            <div className="flex rounded-2xl border border-gray-200 bg-gray-50 overflow-hidden focus-within:ring-2 focus-within:ring-[var(--primary)]/20 focus-within:border-[var(--primary)] focus-within:bg-white">
              <span className="inline-flex items-center px-4 text-sm font-semibold text-gray-700 bg-gray-100 border-r border-gray-200">
                🇮🇳 +91
              </span>
              <input
                type="tel"
                required
                maxLength={10}
                placeholder="98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                className="w-full px-4 py-3 text-sm text-gray-900 bg-transparent focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              Default Delivery Address *
            </label>
            <textarea
              required
              rows={3}
              placeholder="House/Flat No, Street, Landmark, Area, City, Pincode"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm text-gray-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              Bio / Short Description (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Local resident, foodie, tech lover"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm text-gray-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)]"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 px-6 rounded-full shopcart-btn-primary font-bold text-sm flex items-center justify-center gap-2 shadow-lg cursor-pointer mt-4"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-[var(--accent-green)]" />
                <span>Saving Profile...</span>
              </>
            ) : (
              <>
                <span>Complete Onboarding</span>
                <CheckCircle2 className="w-4 h-4 text-[var(--accent-green)]" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
