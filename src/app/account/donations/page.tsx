"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Heart,
  ChevronRight,
  ShieldCheck,
  FileText,
  Download,
  Printer,
  Calendar,
  Building2,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  Sparkles,
} from "lucide-react";
import { endpoints } from "@/lib/api/endpoints";
import { UserDonationItem, DonationReceiptResponse } from "@/types";

export default function MyDonationsPage() {
  const [donations, setDonations] = useState<UserDonationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReceipt, setSelectedReceipt] = useState<DonationReceiptResponse | null>(null);
  const [receiptLoading, setReceiptLoading] = useState(false);
  const [receiptError, setReceiptError] = useState<string | null>(null);

  useEffect(() => {
    fetchMyDonations();
  }, []);

  const fetchMyDonations = async () => {
    try {
      setLoading(true);
      const res = await endpoints.donations.getMyDonations(1, 50);
      setDonations(res.donations || []);
    } catch (err) {
      console.error("Failed to load donations:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewReceipt = async (donationId: string) => {
    try {
      setReceiptLoading(true);
      setReceiptError(null);
      const receipt = await endpoints.donations.getReceipt(donationId);
      setSelectedReceipt(receipt);
    } catch (err: any) {
      console.error("Failed to load receipt:", err);
      setReceiptError(err.message || "Failed to load tax receipt. Please try again.");
    } finally {
      setReceiptLoading(false);
    }
  };

  const totalDonatedINR = donations
    .filter((d) => d.payment_status === "captured" || d.reconciliation_status === "reconciled")
    .reduce((sum, d) => sum + d.amount_inr, 0);

  const total80GEligibleINR = donations
    .filter((d) => d.tax_eligible && (d.payment_status === "captured" || d.reconciliation_status === "reconciled"))
    .reduce((sum, d) => sum + d.amount_inr, 0);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
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
        <span className="font-semibold text-gray-900">My Donations & Tax Receipts</span>
      </nav>

      {/* Header Banner */}
      <div className="rounded-3xl bg-[var(--primary)] text-white p-8 sm:p-10 relative overflow-hidden shadow-lg">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--accent-green)]/20 text-[var(--accent-green)] text-xs font-bold">
            <Heart className="w-3.5 h-3.5 fill-current" />
            <span>Philanthropy & Tax Compliance</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
            My Donations & Section 80G Receipts
          </h1>
          <p className="text-sm text-white/80 leading-relaxed">
            All your contributions directly empower verified NGOs and emergency relief causes.
            Instantly view and download statutory Form 10BE compliant Section 80G tax exemption certificates.
          </p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="shopcart-card p-6 bg-white border border-gray-100 rounded-2xl space-y-1">
          <div className="text-xs font-bold uppercase tracking-wider text-gray-400">Total Donated</div>
          <div className="text-3xl font-black text-gray-900">₹{totalDonatedINR.toLocaleString("en-IN")}</div>
          <p className="text-xs text-gray-500">Across {donations.length} total contributions</p>
        </div>
        <div className="shopcart-card p-6 bg-white border border-emerald-100 rounded-2xl space-y-1 bg-emerald-50/30">
          <div className="text-xs font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            80G Tax Deductible
          </div>
          <div className="text-3xl font-black text-emerald-700">₹{total80GEligibleINR.toLocaleString("en-IN")}</div>
          <p className="text-xs text-emerald-600">Eligible for Indian Income Tax deductions</p>
        </div>
        <div className="shopcart-card p-6 bg-white border border-gray-100 rounded-2xl space-y-1">
          <div className="text-xs font-bold uppercase tracking-wider text-gray-400">Verified Organizations</div>
          <div className="text-3xl font-black text-gray-900">
            {new Set(donations.map((d) => d.org_id)).size}
          </div>
          <p className="text-xs text-gray-500">100% verified KYC entities</p>
        </div>
      </div>

      {/* Donations List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-gray-900">Donation History</h2>
          <Link
            href="/donations"
            className="text-xs font-bold text-[var(--primary)] hover:underline flex items-center gap-1"
          >
            Explore Causes <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="py-20 text-center text-gray-500 text-sm">
            <div className="w-8 h-8 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            Loading your contributions...
          </div>
        ) : donations.length === 0 ? (
          <div className="shopcart-card p-12 text-center bg-white border border-gray-100 rounded-2xl space-y-4">
            <div className="w-14 h-14 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto">
              <Heart className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-gray-900">No donations yet</h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                You haven&apos;t made any donations yet. Support emergency relief campaigns and verified NGOs in your community.
              </p>
            </div>
            <Link
              href="/donations"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[var(--primary)] text-white font-bold text-xs shadow-sm hover:opacity-95"
            >
              Browse Verified Causes
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {donations.map((item) => {
              const isSuccess =
                item.payment_status === "captured" || item.reconciliation_status === "reconciled";
              return (
                <div
                  key={item.id}
                  className="shopcart-card p-5 sm:p-6 bg-white border border-gray-100 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-gray-200 transition-colors"
                >
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-black text-gray-900 uppercase tracking-wide">
                        {item.org_name || "Verified Organization"}
                      </span>
                      {item.tax_eligible && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                          <ShieldCheck className="w-3 h-3" />
                          80G Tax Exempt
                        </span>
                      )}
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          isSuccess
                            ? "bg-emerald-50 text-emerald-700"
                            : item.payment_status === "pending"
                            ? "bg-amber-50 text-amber-700"
                            : "bg-red-50 text-red-700"
                        }`}
                      >
                        {isSuccess ? (
                          <CheckCircle2 className="w-3 h-3" />
                        ) : item.payment_status === "pending" ? (
                          <Clock className="w-3 h-3" />
                        ) : (
                          <AlertCircle className="w-3 h-3" />
                        )}
                        {isSuccess
                          ? "Completed"
                          : item.payment_status === "pending"
                          ? "Pending Confirmation"
                          : "Failed"}
                      </span>
                      <span className="text-[10px] font-semibold text-gray-400 uppercase">
                        via {item.payment_method}
                      </span>
                    </div>

                    {item.campaign_title && (
                      <p className="text-sm font-semibold text-gray-800">
                        Cause: {item.campaign_title}
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(item.created_at).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                      <span>FY: {item.financial_year}</span>
                      {item.receipt_number && (
                        <span className="font-mono text-gray-600 font-semibold">
                          #{item.receipt_number}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                    <div className="text-right">
                      <div className="text-xl font-black text-gray-900">
                        ₹{item.amount_inr.toLocaleString("en-IN")}
                      </div>
                    </div>

                    {item.tax_eligible && isSuccess && (
                      <button
                        onClick={() => handleViewReceipt(item.id)}
                        disabled={receiptLoading}
                        className="px-4 py-2 rounded-xl bg-gray-900 hover:bg-black text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-sm transition-all"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        80G Receipt
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 80G Electronic Receipt Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-100 p-6 sm:p-8 space-y-6 relative">
            {/* Modal Header Actions */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 print:hidden">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full">
                <ShieldCheck className="w-4 h-4" />
                <span>Statutory Section 80G Certificate</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print / Save PDF
                </button>
                <button
                  onClick={() => setSelectedReceipt(null)}
                  className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Receipt Body */}
            <div className="space-y-6 text-gray-900 print:m-0" id="receipt-certificate">
              {/* Receipt Header */}
              <div className="text-center space-y-1 pb-4 border-b border-gray-200">
                <div className="text-xs font-bold uppercase tracking-widest text-gray-400">
                  PAYKOP DIGITAL PLATFORM RECEIPT
                </div>
                <h2 className="text-2xl font-black text-gray-900">
                  {selectedReceipt.organization.legal_name}
                </h2>
                <p className="text-xs text-gray-500">
                  Registered Non-Profit Entity • Category: {selectedReceipt.organization.category}
                </p>
                <div className="inline-block bg-gray-100 px-3 py-1 rounded-md text-xs font-mono font-bold mt-2">
                  Receipt No: {selectedReceipt.receipt_number}
                </div>
              </div>

              {/* Grid Information */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="p-3 bg-gray-50 rounded-xl space-y-1">
                  <div className="text-gray-400 uppercase font-bold text-[10px]">Donor Details</div>
                  <div className="font-bold text-gray-900 text-sm">{selectedReceipt.donor.name}</div>
                  <div>Phone: {selectedReceipt.donor.phone_masked}</div>
                  {selectedReceipt.donor.pan && (
                    <div className="font-mono font-semibold">PAN: {selectedReceipt.donor.pan}</div>
                  )}
                </div>

                <div className="p-3 bg-gray-50 rounded-xl space-y-1">
                  <div className="text-gray-400 uppercase font-bold text-[10px]">Organization Tax IDs</div>
                  {selectedReceipt.organization.pan && (
                    <div className="font-mono">PAN: {selectedReceipt.organization.pan}</div>
                  )}
                  {selectedReceipt.organization.registration_number && (
                    <div>Reg No: {selectedReceipt.organization.registration_number}</div>
                  )}
                  <div className="font-semibold text-emerald-700">
                    80G Registered: Yes (Approved)
                  </div>
                </div>
              </div>

              {/* Contribution Line */}
              <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-2xl space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-gray-600">Contribution Amount</span>
                  <span className="text-2xl font-black text-emerald-800 font-mono">
                    ₹{selectedReceipt.amount_inr.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-gray-500 pt-1 border-t border-emerald-100">
                  <span>Payment Mode: {selectedReceipt.payment_method.toUpperCase()}</span>
                  <span>Financial Year: {selectedReceipt.financial_year}</span>
                  <span>
                    Date:{" "}
                    {new Date(selectedReceipt.receipt_date).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </div>

              {/* Statutory Statement */}
              <div className="p-4 bg-gray-50 rounded-xl text-[11px] text-gray-500 leading-relaxed space-y-2">
                <p className="font-semibold text-gray-700">Statutory Tax Declaration:</p>
                <p>{selectedReceipt.statutory_note}</p>
                <p className="text-[10px] text-gray-400">
                  This document is an authentic electronic record issued under the Information Technology Act, 2000
                  and complies with circular rules issued under Section 80G of the Income Tax Act, 1961.
                </p>
              </div>

              {/* Digital Seal */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200 text-xs text-gray-400">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  <span className="font-semibold text-gray-600">Digitally Verified by Paykop</span>
                </div>
                <div className="font-mono text-[10px]">
                  ID: {selectedReceipt.donation_id.slice(0, 18)}...
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
