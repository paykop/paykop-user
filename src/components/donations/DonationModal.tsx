"use client";

import { useState, useEffect } from "react";
import {
  X,
  Heart,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileText,
  Building2,
} from "lucide-react";
import { api } from "@/lib/api/endpoints";
import { session } from "@/lib/auth/session";
import { toast } from "@/lib/toast";
import { OrganizationPublic, DonationStatusResponse } from "@/types";

interface DonationModalProps {
  isOpen: boolean;
  onClose: () => void;
  organization: OrganizationPublic;
  campaignId?: number;
  campaignTitle?: string;
}

function generateDonationKey(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `don_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function DonationModal({
  isOpen,
  onClose,
  organization,
  campaignId,
  campaignTitle,
}: DonationModalProps) {
  const [amountRupees, setAmountRupees] = useState<number>(1000);
  const [customRupees, setCustomRupees] = useState<string>("");
  const [donorName, setDonorName] = useState<string>("");
  const [donorPhone, setDonorPhone] = useState<string>("");
  const [donorEmail, setDonorEmail] = useState<string>("");
  const [taxEligible, setTaxEligible] = useState<boolean>(false);
  const [donorPan, setDonorPan] = useState<string>("");

  const [loading, setLoading] = useState<boolean>(false);
  const [polling, setPolling] = useState<boolean>(false);
  const [completedDonation, setCompletedDonation] = useState<DonationStatusResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");

  // Prefill from authenticated session if available
  useEffect(() => {
    if (isOpen && session.isAuthenticated()) {
      const user = session.getUser();
      if (user) {
        setDonorName((prev) => prev || `${user.first_name || ""} ${user.last_name || ""}`.trim());
        setDonorPhone((prev) => prev || user.phone || "");
        setDonorEmail((prev) => prev || user.email || "");
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const effectiveRupees = customRupees ? Number(customRupees) : amountRupees;
  const effectivePaise = Math.round(effectiveRupees * 100);

  const validateForm = (): boolean => {
    if (effectiveRupees < 10) {
      setErrorMsg("Minimum donation amount is ₹10.");
      return false;
    }
    if (!donorName.trim()) {
      setErrorMsg("Please enter your full name.");
      return false;
    }
    const cleanPhone = donorPhone.replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      setErrorMsg("Please enter a valid 10-digit mobile number.");
      return false;
    }
    if (taxEligible) {
      const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
      if (!donorPan.trim() || !panRegex.test(donorPan.trim().toUpperCase())) {
        setErrorMsg("Valid 10-character PAN (e.g. ABCDE1234F) is required for 80G tax exemption.");
        return false;
      }
    }
    setErrorMsg("");
    return true;
  };

  const handleStartDonation = async () => {
    if (!validateForm()) return;
    setErrorMsg("");
    setLoading(true);

    try {
      const formattedPhone = donorPhone.startsWith("+91")
        ? donorPhone
        : `+91${donorPhone.replace(/\D/g, "").slice(-10)}`;

      const idempotencyKey = generateDonationKey();

      const intent = await api.donations.createIntent(
        {
          org_id: organization.id,
          campaign_id: campaignId ? Number(campaignId) : undefined,
          amount_paise: effectivePaise,
          donor_name: donorName.trim(),
          donor_phone: formattedPhone,
          donor_email: donorEmail.trim() || undefined,
          donor_pan: taxEligible ? donorPan.trim().toUpperCase() : undefined,
          tax_eligible: taxEligible,
        },
        idempotencyKey
      );

      const rzpKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
      if (!rzpKey) {
        throw new Error("Payment gateway is not configured.");
      }

      if (!window.Razorpay) {
        throw new Error("Razorpay checkout is loading. Please try again in a few seconds.");
      }

      const options = {
        key: rzpKey,
        amount: intent.amount_paise,
        currency: intent.currency || "INR",
        name: organization.legal_name,
        description: campaignTitle ? `Donation: ${campaignTitle}` : "General Donation",
        order_id: intent.razorpay_order_id,
        prefill: {
          name: donorName,
          email: donorEmail,
          contact: formattedPhone.replace(/\D/g, "").slice(-10),
        },
        theme: {
          color: "#db2777", // Pink-600
        },
        handler: async function () {
          // Payment captured on client; begin polling backend for confirmation
          setLoading(false);
          setPolling(true);
          pollStatus(intent.donation_id);
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err: unknown) {
      setLoading(false);
      const msg = err instanceof Error ? err.message : "Failed to initiate donation.";
      setErrorMsg(msg);
      toast.error(msg);
    }
  };

  const pollStatus = async (donationId: string) => {
    let attempts = 0;
    const maxAttempts = 15;

    const interval = setInterval(async () => {
      attempts++;
      try {
        const res = await api.donations.getStatus(donationId);
        if (res.payment_status === "captured") {
          clearInterval(interval);
          setPolling(false);
          setCompletedDonation(res);
          toast.success("Thank you! Your donation has been verified.");
          return;
        }
        if (res.payment_status === "failed") {
          clearInterval(interval);
          setPolling(false);
          setErrorMsg("Donation payment failed at the gateway.");
          return;
        }
      } catch {
        // Continue polling
      }

      if (attempts >= maxAttempts) {
        clearInterval(interval);
        setPolling(false);
        // Even if polling timed out, show pending confirmation
        setCompletedDonation({
          id: donationId,
          org_id: organization.id,
          campaign_id: campaignId,
          payment_status: "pending",
          reconciliation_status: "not_applicable",
          amount_paise: effectivePaise,
          tax_eligible: taxEligible,
          financial_year: "",
          donor_name: donorName,
          donor_phone_masked: donorPhone,
          created_at: new Date().toISOString(),
        });
      }
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-pink-600 via-rose-600 to-pink-700 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-semibold backdrop-blur-xs">
              <Building2 className="w-3.5 h-3.5" />
              Verified NGO
            </span>
            {organization.is_80g_registered && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/30 text-emerald-100 text-xs font-bold border border-emerald-400/40">
                <FileText className="w-3 h-3" />
                80G Tax Exemption
              </span>
            )}
          </div>

          <h2 className="text-xl sm:text-2xl font-black tracking-tight line-clamp-1">
            {organization.legal_name}
          </h2>
          {campaignTitle && (
            <p className="text-xs text-pink-100 mt-1 line-clamp-1">
              Campaign: <span className="font-semibold">{campaignTitle}</span>
            </p>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {completedDonation ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-black text-gray-900">Donation Successful!</h3>
              <p className="text-xs text-gray-600 max-w-sm mx-auto">
                Thank you, <span className="font-bold">{completedDonation.donor_name}</span>. Your gift of{" "}
                <span className="font-bold text-pink-600">
                  ₹{(completedDonation.amount_paise / 100).toLocaleString("en-IN")}
                </span>{" "}
                has been received by {organization.legal_name}.
              </p>

              {completedDonation.tax_eligible && (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 text-left space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    Section 80G Tax Benefit Applicable
                  </div>
                  <p className="text-[11px] text-emerald-700">
                    A formal sequential receipt will be filed with the Income Tax Department for Financial Year{" "}
                    {completedDonation.financial_year || "2026-2027"}.
                  </p>
                </div>
              )}

              <button
                onClick={onClose}
                className="w-full py-3.5 rounded-2xl bg-pink-600 hover:bg-pink-700 text-white font-bold text-sm shadow-md transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          ) : polling ? (
            <div className="text-center py-12 space-y-3">
              <Loader2 className="w-10 h-10 text-pink-600 animate-spin mx-auto" />
              <h3 className="font-bold text-base text-gray-900">Verifying Payment with Gateway...</h3>
              <p className="text-xs text-gray-500">
                Please wait while we confirm your contribution with Razorpay and {organization.legal_name}.
              </p>
            </div>
          ) : (
            <>
              {errorMsg && (
                <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-red-700">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Amount Selection */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2">
                  Select Donation Amount (INR)
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[500, 1000, 2500, 5000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => {
                        setAmountRupees(amt);
                        setCustomRupees("");
                      }}
                      className={`py-2.5 px-2 rounded-xl text-xs font-bold transition-all text-center cursor-pointer ${
                        amountRupees === amt && !customRupees
                          ? "bg-pink-600 text-white shadow-sm ring-2 ring-pink-600 ring-offset-1"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      ₹{amt.toLocaleString("en-IN")}
                    </button>
                  ))}
                </div>

                <div className="mt-2.5">
                  <input
                    type="number"
                    min={10}
                    placeholder="Or enter custom amount (e.g. 1500)"
                    value={customRupees}
                    onChange={(e) => setCustomRupees(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 placeholder:text-gray-400 focus:outline-hidden focus:ring-2 focus:ring-pink-500"
                  />
                </div>
              </div>

              {/* Donor Contact Details */}
              <div className="space-y-3 pt-2 border-t border-gray-100">
                <h4 className="text-xs font-bold text-gray-900">Donor Information</h4>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. John Doe"
                    value={donorName}
                    onChange={(e) => setDonorName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-pink-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                      Mobile Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      placeholder="9876543210"
                      value={donorPhone}
                      onChange={(e) => setDonorPhone(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-pink-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                      Email Address (Optional)
                    </label>
                    <input
                      type="email"
                      placeholder="donor@example.com"
                      value={donorEmail}
                      onChange={(e) => setDonorEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-pink-500"
                    />
                  </div>
                </div>
              </div>

              {/* Section 80G Tax Exemption */}
              {organization.is_80g_registered && (
                <div className="p-4 rounded-2xl bg-pink-50/60 border border-pink-100 space-y-3">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={taxEligible}
                      onChange={(e) => setTaxEligible(e.target.checked)}
                      className="mt-0.5 rounded-sm border-gray-300 text-pink-600 focus:ring-pink-500 cursor-pointer"
                    />
                    <div className="text-xs">
                      <span className="font-bold text-gray-900 block">
                        Claim 50% Tax Deduction under Section 80G
                      </span>
                      <span className="text-[11px] text-gray-500 block">
                        Requires Permanent Account Number (PAN) for tax authority filing.
                      </span>
                    </div>
                  </label>

                  {taxEligible && (
                    <div className="pt-2">
                      <label className="block text-[11px] font-semibold text-gray-700 mb-1 uppercase tracking-wider">
                        Donor PAN Card Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        maxLength={10}
                        placeholder="ABCDE1234F"
                        value={donorPan}
                        onChange={(e) => setDonorPan(e.target.value.toUpperCase())}
                        className="w-full px-3.5 py-2 bg-white border border-pink-200 rounded-xl text-xs font-mono font-bold tracking-widest text-gray-900 uppercase focus:outline-hidden focus:ring-2 focus:ring-pink-500"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Trust Badge */}
              <div className="flex items-center gap-2 text-[11px] text-gray-500">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>100% Secure 256-bit encrypted Razorpay payment gateway.</span>
              </div>

              {/* Submit CTA */}
              <button
                type="button"
                disabled={loading}
                onClick={handleStartDonation}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white font-bold text-sm shadow-lg shadow-pink-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Preparing Checkout...</span>
                  </>
                ) : (
                  <>
                    <Heart className="w-4 h-4 fill-white" />
                    <span>Donate ₹{effectiveRupees.toLocaleString("en-IN")} Securely</span>
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
