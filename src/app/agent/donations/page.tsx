"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Briefcase,
  ChevronRight,
  Heart,
  ShieldCheck,
  AlertTriangle,
  Upload,
  CheckCircle2,
  Clock,
  Building2,
  FileText,
  UserCheck,
  Loader2,
  Camera,
} from "lucide-react";
import { AgentGate } from "@/components/agent/AgentGate";
import { endpoints } from "@/lib/api/endpoints";
import { OrganizationPublic, DonationCampaign } from "@/types";
import { toast } from "@/lib/toast";

interface AgentDonationRecord {
  id: string;
  org_id: string;
  campaign_id?: number;
  payment_method: string;
  amount_paise: number;
  donor_name: string;
  donor_phone_masked: string;
  donor_email?: string;
  tax_eligible: boolean;
  financial_year: string;
  payment_status: string;
  reconciliation_status: string;
  collected_by_agent_id: string;
  collection_proof_url?: string;
  deposit_proof_url?: string;
  created_at: string;
}

export default function AgentDonationsPage() {
  return (
    <AgentGate>
      <AgentDonationsContent />
    </AgentGate>
  );
}

function AgentDonationsContent() {
  const [activeTab, setActiveTab] = useState<"collect" | "history">("collect");
  const [orgs, setOrgs] = useState<OrganizationPublic[]>([]);
  const [loadingOrgs, setLoadingOrgs] = useState(true);

  // Form State
  const [selectedOrgId, setSelectedOrgId] = useState("");
  const [donorName, setDonorName] = useState("");
  const [donorPhone, setDonorPhone] = useState("");
  const [donorEmail, setDonorEmail] = useState("");
  const [donorPAN, setDonorPAN] = useState("");
  const [amountINR, setAmountINR] = useState("");
  const [taxEligible, setTaxEligible] = useState(false);
  const [dpdpConsent, setDpdpConsent] = useState(false);
  const [collectionProofUrl, setCollectionProofUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // History State
  const [collections, setCollections] = useState<AgentDonationRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [uploadingDepositForId, setUploadingDepositForId] = useState<string | null>(null);
  const [depositSlipUrl, setDepositSlipUrl] = useState("");
  const [depositSubmitting, setDepositSubmitting] = useState(false);

  useEffect(() => {
    fetchOrganizations();
    fetchCollections();
  }, []);

  const fetchOrganizations = async () => {
    try {
      setLoadingOrgs(true);
      const res = await endpoints.donations.listOrganizations(1, 100);
      setOrgs(res.organizations || []);
      if (res.organizations && res.organizations.length > 0) {
        setSelectedOrgId(res.organizations[0].id);
      }
    } catch (err) {
      console.error("Failed to load organizations:", err);
    } finally {
      setLoadingOrgs(false);
    }
  };

  const fetchCollections = async () => {
    try {
      setLoadingHistory(true);
      const res = await endpoints.donations.agentListDonations(1, 50);
      setCollections(res.donations || []);
    } catch (err) {
      console.error("Failed to load agent collections:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const parsedAmount = parseFloat(amountINR) || 0;
  const exceedsCashCap = parsedAmount > 2000;

  const handleCollectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedOrgId) {
      toast.error("Please select a verified organization");
      return;
    }
    if (!donorName.trim()) {
      toast.error("Donor name is required");
      return;
    }
    if (!donorPhone.trim() || donorPhone.trim().length < 10) {
      toast.error("Valid 10-digit mobile number is required");
      return;
    }
    if (parsedAmount <= 0) {
      toast.error("Please enter a valid donation amount");
      return;
    }
    if (taxEligible && !donorPAN.trim()) {
      toast.error("Donor PAN is required for Section 80G tax exemption");
      return;
    }
    if (!dpdpConsent) {
      toast.error("DPDP consent is required under Digital Personal Data Protection Act, 2023");
      return;
    }

    try {
      setSubmitting(true);
      const amountPaise = Math.round(parsedAmount * 100);
      const resp = await endpoints.donations.agentCollectCash({
        org_id: selectedOrgId,
        amount_paise: amountPaise,
        donor_name: donorName.trim(),
        donor_phone: donorPhone.trim(),
        donor_email: donorEmail.trim() || undefined,
        donor_pan: donorPAN.trim() ? donorPAN.trim().toUpperCase() : undefined,
        tax_eligible: taxEligible && !exceedsCashCap,
        dpdp_consent_given: dpdpConsent,
        collection_proof_url: collectionProofUrl.trim() || undefined,
      });

      toast.success(`Cash donation of ₹${parsedAmount.toLocaleString("en-IN")} recorded successfully`);

      // Reset form
      setDonorName("");
      setDonorPhone("");
      setDonorEmail("");
      setDonorPAN("");
      setAmountINR("");
      setTaxEligible(false);
      setDpdpConsent(false);
      setCollectionProofUrl("");

      // Switch to history tab and refresh
      setActiveTab("history");
      fetchCollections();
    } catch (err: any) {
      console.error("Failed to record cash donation:", err);
      toast.error(err.message || "Failed to record cash donation");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUploadDepositSlip = async (donationId: string) => {
    if (!depositSlipUrl.trim()) {
      toast.error("Please provide deposit slip proof URL");
      return;
    }

    try {
      setDepositSubmitting(true);
      await endpoints.donations.agentUploadDepositProof(donationId, depositSlipUrl.trim());
      toast.success("Bank deposit slip submitted for admin reconciliation");
      setUploadingDepositForId(null);
      setDepositSlipUrl("");
      fetchCollections();
    } catch (err: any) {
      console.error("Failed to upload deposit proof:", err);
      toast.error(err.message || "Failed to upload deposit slip");
    } finally {
      setDepositSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-gray-500">
        <Link href="/" className="hover:text-gray-900">
          Home
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href="/agent" className="hover:text-gray-900">
          Agent Hub
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="font-semibold text-gray-900">Cash Donation Collections</span>
      </nav>

      {/* Header Banner */}
      <div className="rounded-3xl bg-[var(--primary)] text-white p-8 sm:p-10 relative overflow-hidden shadow-lg">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--accent-green)]/20 text-[var(--accent-green)] text-xs font-bold">
            <Briefcase className="w-3.5 h-3.5" />
            <span>Field Agent Cash Portal</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
            Collect Cash Donations in the Field
          </h1>
          <p className="text-sm text-white/80 leading-relaxed">
            Record voluntary cash donations for verified charities with statutory Section 80G(5D) cap enforcement
            and mandatory DPDP Act 2023 donor consent verification.
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab("collect")}
          className={`px-6 py-3 font-bold text-xs border-b-2 transition-all flex items-center gap-2 ${
            activeTab === "collect"
              ? "border-[var(--primary)] text-[var(--primary)]"
              : "border-transparent text-gray-500 hover:text-gray-800"
          }`}
        >
          <Heart className="w-4 h-4" />
          Collect Cash Donation
        </button>
        <button
          onClick={() => {
            setActiveTab("history");
            fetchCollections();
          }}
          className={`px-6 py-3 font-bold text-xs border-b-2 transition-all flex items-center gap-2 ${
            activeTab === "history"
              ? "border-[var(--primary)] text-[var(--primary)]"
              : "border-transparent text-gray-500 hover:text-gray-800"
          }`}
        >
          <FileText className="w-4 h-4" />
          My Collections & Deposits ({collections.length})
        </button>
      </div>

      {activeTab === "collect" ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Collection Form */}
          <div className="lg:col-span-2 shopcart-card p-6 sm:p-8 bg-white border border-gray-100 rounded-3xl space-y-6">
            <h2 className="text-xl font-black text-gray-900">New Cash Contribution</h2>

            <form onSubmit={handleCollectSubmit} className="space-y-5">
              {/* Organization Select */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700">Verified Organization</label>
                {loadingOrgs ? (
                  <div className="py-2 text-xs text-gray-400">Loading verified NGOs...</div>
                ) : (
                  <select
                    value={selectedOrgId}
                    onChange={(e) => setSelectedOrgId(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                  >
                    {orgs.map((org) => (
                      <option key={org.id} value={org.id}>
                        {org.legal_name} ({org.category})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Amount */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700">Donation Amount (INR)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">
                    ₹
                  </span>
                  <input
                    type="number"
                    min="10"
                    placeholder="500"
                    value={amountINR}
                    onChange={(e) => setAmountINR(e.target.value)}
                    className="w-full pl-8 pr-4 py-3 rounded-xl border border-gray-200 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                  />
                </div>
              </div>

              {/* Donor Contact */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700">Donor Name *</label>
                  <input
                    type="text"
                    placeholder="Suresh Kumar"
                    value={donorName}
                    onChange={(e) => setDonorName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700">Donor Mobile (10-digit) *</label>
                  <input
                    type="tel"
                    placeholder="+919876543210"
                    value={donorPhone}
                    onChange={(e) => setDonorPhone(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700">Donor Email (Optional)</label>
                <input
                  type="email"
                  placeholder="donor@example.com"
                  value={donorEmail}
                  onChange={(e) => setDonorEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                />
              </div>

              {/* 80G Tax Exemption Toggle */}
              <div className="p-4 bg-gray-50 border border-gray-100 rounded-2xl space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={taxEligible}
                    onChange={(e) => setTaxEligible(e.target.checked)}
                    className="w-4 h-4 rounded text-[var(--primary)] focus:ring-[var(--primary)]"
                  />
                  <div className="text-xs">
                    <span className="font-bold text-gray-900">
                      Request Section 80G Tax Exemption Receipt
                    </span>
                    <p className="text-gray-500 text-[11px]">
                      Requires donor Permanent Account Number (PAN).
                    </p>
                  </div>
                </label>

                {taxEligible && (
                  <div className="pt-2 space-y-3 border-t border-gray-200">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700">Donor PAN Card Number *</label>
                      <input
                        type="text"
                        maxLength={10}
                        placeholder="ABCDE1234F"
                        value={donorPAN}
                        onChange={(e) => setDonorPAN(e.target.value.toUpperCase())}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-mono font-bold uppercase focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                      />
                    </div>

                    {exceedsCashCap && (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold">Statutory Section 80G(5D) Cash Limit Notice:</span>
                          <p className="text-[11px] mt-0.5">
                            Under Indian Income Tax Law, cash donations exceeding ₹2,000 cannot be claimed for tax
                            exemption. This gift will be collected as a standard non-exempt contribution.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* DPDP Act Consent Checkbox (MANDATORY) */}
              <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-2xl space-y-2">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={dpdpConsent}
                    onChange={(e) => setDpdpConsent(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 mt-0.5"
                  />
                  <div className="text-xs leading-relaxed text-emerald-950">
                    <span className="font-bold">
                      Digital Personal Data Protection (DPDP) Act, 2023 Consent Gate *
                    </span>
                    <p className="text-[11px] text-emerald-800/90 mt-1">
                      I certify that the donor has been informed and explicitly consented to the collection of their
                      name, phone number, and tax identity exclusively for voluntary donation tracking and statutory
                      Section 80G compliance.
                    </p>
                  </div>
                </label>
              </div>

              {/* Photo Proof URL / R2 Upload */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700">Cash Handover Proof Photo URL (Optional)</label>
                <div className="relative">
                  <Camera className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="url"
                    placeholder="https://r2.paykop.com/cash_proof_123.jpg"
                    value={collectionProofUrl}
                    onChange={(e) => setCollectionProofUrl(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting || !dpdpConsent}
                className="w-full py-4 rounded-2xl bg-[var(--primary)] text-white font-bold text-sm shadow-md hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Recording Collection...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Record Cash Donation (₹{parsedAmount.toLocaleString("en-IN")})
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Compliance & Rules Sidebar */}
          <div className="space-y-6">
            <div className="shopcart-card p-6 bg-white border border-gray-100 rounded-3xl space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-900 uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Field Collection Protocol
              </div>
              <ul className="space-y-3 text-xs text-gray-600 leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="font-bold text-gray-900">•</span>
                  <span>
                    <strong>Cash is pending</strong> until you deposit funds into the organization bank account and upload the deposit receipt.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-gray-900">•</span>
                  <span>
                    <strong>₹2,000 Cash Cap:</strong> Section 80G(5D) strictly limits cash tax exemption to ₹2,000 per donor annually.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-gray-900">•</span>
                  <span>
                    <strong>DPDP Consent is mandatory:</strong> Never submit without direct verbal or written agreement from the donor.
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      ) : (
        /* History & Deposit Slip Upload Tab */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-gray-900">Your Cash Collections</h2>
            <button
              onClick={fetchCollections}
              className="text-xs font-bold text-[var(--primary)] hover:underline"
            >
              Refresh
            </button>
          </div>

          {loadingHistory ? (
            <div className="py-20 text-center text-gray-500 text-sm">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-[var(--primary)]" />
              Loading your collections...
            </div>
          ) : collections.length === 0 ? (
            <div className="shopcart-card p-12 text-center bg-white border border-gray-100 rounded-3xl space-y-2">
              <p className="text-sm font-bold text-gray-700">No cash collections recorded yet.</p>
              <p className="text-xs text-gray-400">
                Use the &ldquo;Collect Cash Donation&rdquo; tab to record your first field contribution.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {collections.map((item) => (
                <div
                  key={item.id}
                  className="shopcart-card p-5 bg-white border border-gray-100 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold text-gray-900">{item.donor_name}</span>
                      <span className="text-xs text-gray-400 font-mono">({item.donor_phone_masked})</span>
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          item.reconciliation_status === "reconciled"
                            ? "bg-emerald-50 text-emerald-700"
                            : item.deposit_proof_url
                            ? "bg-blue-50 text-blue-700"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {item.reconciliation_status === "reconciled" ? (
                          <CheckCircle2 className="w-3 h-3" />
                        ) : (
                          <Clock className="w-3 h-3" />
                        )}
                        {item.reconciliation_status === "reconciled"
                          ? "Reconciled & Verified"
                          : item.deposit_proof_url
                          ? "Deposit Slip Under Review"
                          : "Awaiting Bank Deposit Slip"}
                      </span>
                    </div>

                    <div className="text-xs text-gray-500">
                      Date: {new Date(item.created_at).toLocaleDateString("en-IN")} • FY: {item.financial_year}
                    </div>

                    {item.deposit_proof_url && (
                      <div className="text-[11px] text-blue-600">
                        Deposit Slip Uploaded:{" "}
                        <a
                          href={item.deposit_proof_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline"
                        >
                          View Receipt
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-lg font-black text-gray-900">
                        ₹{(item.amount_paise / 100).toLocaleString("en-IN")}
                      </div>
                    </div>

                    {!item.deposit_proof_url && item.reconciliation_status !== "reconciled" && (
                      <button
                        onClick={() => {
                          setUploadingDepositForId(item.id);
                          setDepositSlipUrl("");
                        }}
                        className="px-4 py-2 rounded-xl bg-[var(--primary)] text-white text-xs font-bold shadow-sm hover:opacity-95 flex items-center gap-1.5"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        Upload Bank Slip
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Deposit Slip Upload Modal */}
      {uploadingDepositForId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-gray-100">
            <h3 className="text-base font-black text-gray-900">Upload Bank Deposit Slip</h3>
            <p className="text-xs text-gray-500">
              Provide the direct URL of the bank deposit slip photo after banking the cash contribution.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700">Deposit Slip Image URL</label>
              <input
                type="url"
                placeholder="https://r2.paykop.com/deposit_slip_001.jpg"
                value={depositSlipUrl}
                onChange={(e) => setDepositSlipUrl(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setUploadingDepositForId(null)}
                className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleUploadDepositSlip(uploadingDepositForId)}
                disabled={depositSubmitting || !depositSlipUrl.trim()}
                className="px-5 py-2 rounded-xl bg-[var(--primary)] text-white text-xs font-bold shadow-sm hover:opacity-95 disabled:opacity-50"
              >
                {depositSubmitting ? "Submitting..." : "Submit Proof"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
