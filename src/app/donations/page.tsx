"use client";

import { useState } from "react";
import Link from "next/link";
import { MediaThumb } from "@/components/ui/MediaThumb";
import {
  HandHeart,
  Users,
  ArrowRight,
  Loader2,
  ChevronRight,
  Building2,
  ShieldCheck,
  FileText,
  Heart,
} from "lucide-react";
import { formatPaise } from "@/lib/money";
import { useDonations, useOrganizations } from "@/lib/queries/hooks";
import { DonationModal } from "@/components/donations/DonationModal";
import { OrganizationPublic } from "@/types";

export default function DonationsPage() {
  const [activeTab, setActiveTab] = useState<"organizations" | "campaigns">("organizations");
  const { data: rawCampaigns, isLoading: loadingCampaigns } = useDonations();
  const { data: orgData, isLoading: loadingOrgs } = useOrganizations();

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<OrganizationPublic | null>(null);
  const [selectedCampaign, setSelectedCampaign] = useState<{ id?: number; title?: string }>({});

  const campaigns = Array.isArray(rawCampaigns)
    ? rawCampaigns
    : rawCampaigns && typeof rawCampaigns === "object" && "campaigns" in rawCampaigns && Array.isArray((rawCampaigns as { campaigns?: unknown[] }).campaigns)
    ? (rawCampaigns as { campaigns: typeof rawCampaigns }).campaigns
    : [];

  const organizations = orgData?.organizations || [];

  const handleDonateDirect = (org: OrganizationPublic, camp?: { id: number; title: string }) => {
    setSelectedOrg(org);
    setSelectedCampaign(camp || {});
    setModalOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-gray-500">
        <Link href="/" className="hover:text-gray-900">
          Home
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="font-semibold text-gray-900">Community Donations</span>
      </nav>

      {/* Hero Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-pink-600 via-rose-600 to-indigo-900 text-white p-8 sm:p-10 relative overflow-hidden shadow-xl">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold backdrop-blur-xs">
            <HandHeart className="w-3.5 h-3.5" />
            <span>100% Platform Verified NGOs & Causes</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
            Transparent Giving, Verified Impact
          </h1>
          <p className="text-sm text-pink-100">
            Direct donations to registered non-profits with Section 80G tax deduction receipts, zero platform markups, and end-to-end tracking.
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-3 border-b border-gray-200 pb-1">
        <button
          onClick={() => setActiveTab("organizations")}
          className={`pb-3 px-3 text-sm font-bold flex items-center gap-2 transition-colors relative cursor-pointer ${
            activeTab === "organizations"
              ? "text-pink-600 border-b-2 border-pink-600"
              : "text-gray-500 hover:text-gray-900"
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Verified Organizations</span>
          <span className="ml-1 px-2 py-0.5 rounded-full text-[11px] bg-gray-100 text-gray-700">
            {organizations.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("campaigns")}
          className={`pb-3 px-3 text-sm font-bold flex items-center gap-2 transition-colors relative cursor-pointer ${
            activeTab === "campaigns"
              ? "text-pink-600 border-b-2 border-pink-600"
              : "text-gray-500 hover:text-gray-900"
          }`}
        >
          <HandHeart className="w-4 h-4" />
          <span>Emergency Relief Causes</span>
          <span className="ml-1 px-2 py-0.5 rounded-full text-[11px] bg-gray-100 text-gray-700">
            {campaigns.length}
          </span>
        </button>
      </div>

      {/* TAB 1: Verified Organizations */}
      {activeTab === "organizations" && (
        <>
          {loadingOrgs ? (
            <div className="py-20 text-center">
              <Loader2 className="w-8 h-8 text-pink-600 animate-spin mx-auto" />
              <p className="text-xs text-gray-500 mt-2">Loading verified organizations...</p>
            </div>
          ) : organizations.length === 0 ? (
            <div className="shopcart-card p-12 text-center bg-white space-y-4">
              <Building2 className="w-12 h-12 text-gray-300 mx-auto" />
              <h3 className="font-bold text-lg text-gray-900">No organizations listed yet</h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                Organizations are undergoing administrative compliance verification. Please check back shortly.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {organizations.map((org) => (
                <div
                  key={org.id}
                  className="shopcart-card p-6 bg-white flex flex-col justify-between space-y-4 hover:border-pink-300 hover:shadow-md transition-all group"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Verified NGO
                      </span>
                      {org.is_80g_registered && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-pink-50 text-pink-700 text-[11px] font-bold">
                          <FileText className="w-3 h-3" />
                          80G Tax Exemption
                        </span>
                      )}
                    </div>

                    <div>
                      <h3 className="font-bold text-lg text-gray-900 group-hover:text-pink-600 transition-colors line-clamp-1">
                        {org.legal_name}
                      </h3>
                      <span className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold">
                        {org.category || "Social Welfare"}
                      </span>
                      <p className="text-xs text-gray-500 line-clamp-3 mt-2">
                        {org.description ||
                          "Committed to grassroots community support, healthcare aid, and education initiatives."}
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-100 flex items-center gap-2">
                    <Link
                      href={`/donations/organizations/${org.id}`}
                      className="flex-1 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs flex items-center justify-center transition-colors"
                    >
                      View Profile
                    </Link>
                    <button
                      onClick={() => handleDonateDirect(org)}
                      className="flex-1 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                    >
                      <Heart className="w-3.5 h-3.5 fill-white" />
                      <span>Donate</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* TAB 2: Active Causes / Campaigns */}
      {activeTab === "campaigns" && (
        <>
          {loadingCampaigns ? (
            <div className="py-20 text-center">
              <Loader2 className="w-8 h-8 text-pink-600 animate-spin mx-auto" />
              <p className="text-xs text-gray-500 mt-2">Loading active causes...</p>
            </div>
          ) : campaigns.length === 0 ? (
            <div className="shopcart-card p-12 text-center bg-white space-y-4">
              <HandHeart className="w-12 h-12 text-pink-400 mx-auto" />
              <h3 className="font-bold text-lg text-gray-900">No active campaigns right now</h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                All current community relief goals have been met. Thank you for your generous support!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {campaigns.map((camp) => {
                const target = camp.target_amount || 1;
                const raised = camp.raised_amount || 0;
                const pct = Math.min(100, Math.round((raised / target) * 100));
                const img = camp.image || camp.image_url || null;

                return (
                  <div
                    key={camp.id}
                    className="shopcart-card p-5 bg-white flex flex-col justify-between space-y-4 hover:border-pink-300 transition-all group"
                  >
                    <div className="space-y-3">
                      <div className="h-48 rounded-2xl overflow-hidden relative bg-gray-50">
                        <MediaThumb
                          src={img}
                          alt={camp.title}
                          className="object-cover group-hover:scale-105 transition-transform"
                        />
                        {camp.urgent && (
                          <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-red-600 text-white font-extrabold text-[10px] uppercase shadow-xs">
                            Urgent Cause
                          </span>
                        )}
                      </div>

                      <div>
                        <h3 className="font-bold text-base text-gray-900 line-clamp-2 group-hover:text-pink-600 transition-colors">
                          {camp.title}
                        </h3>
                        <p className="text-xs text-gray-500 line-clamp-2 mt-1">{camp.description}</p>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="space-y-2 pt-2 border-t border-gray-100">
                      <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-pink-600 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-pink-600">{formatPaise(raised)}</span>
                        <span className="text-gray-400">Target: {formatPaise(target)}</span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-gray-500 pt-1">
                        <div className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-gray-400" />
                          <span>{camp.donor_count || 0} Donors</span>
                        </div>
                        <span className="font-semibold text-emerald-700">{pct}% Funded</span>
                      </div>

                      <Link
                        href={`/donations/${camp.id}`}
                        className="w-full py-3 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors mt-2"
                      >
                        <span>Donate to Campaign</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Donation Modal */}
      {selectedOrg && (
        <DonationModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          organization={selectedOrg}
          campaignId={selectedCampaign.id}
          campaignTitle={selectedCampaign.title}
        />
      )}
    </div>
  );
}
