"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Building2,
  ShieldCheck,
  ChevronRight,
  Loader2,
  FileText,
  Heart,
  Calendar,
  Users,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { useOrganization } from "@/lib/queries/hooks";
import { formatPaise } from "@/lib/money";
import { DonationModal } from "@/components/donations/DonationModal";
import { MediaThumb } from "@/components/ui/MediaThumb";

export default function OrganizationDetailPage() {
  const params = useParams();
  const orgId = params.id as string;

  const { data: org, isLoading } = useOrganization(orgId);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<{ id?: number; title?: string }>({});

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-[var(--primary)] animate-spin" />
        <p className="text-xs text-gray-500 mt-2">Loading organization details...</p>
      </div>
    );
  }

  if (!org) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <Building2 className="w-12 h-12 text-gray-300 mx-auto" />
        <h2 className="text-xl font-bold text-gray-900">Organization Not Found</h2>
        <p className="text-xs text-gray-500">
          This organization might be pending administrative verification or does not exist.
        </p>
        <Link
          href="/donations"
          className="inline-flex px-6 py-2.5 rounded-full shopcart-btn-primary text-xs font-bold"
        >
          Explore Verified Causes
        </Link>
      </div>
    );
  }

  const handleDonateToOrg = () => {
    setSelectedCampaign({});
    setModalOpen(true);
  };

  const handleDonateToCampaign = (campId: number, campTitle: string) => {
    setSelectedCampaign({ id: campId, title: campTitle });
    setModalOpen(true);
  };

  const activeCampaigns = org.active_campaigns || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-xs text-gray-500">
        <Link href="/" className="hover:text-gray-900">
          Home
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href="/donations" className="hover:text-gray-900">
          Donations
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="font-semibold text-gray-900 truncate">{org.legal_name}</span>
      </nav>

      {/* Organization Hero Profile */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-8 sm:p-10 relative overflow-hidden shadow-xl border border-slate-800">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Verified Non-Profit
              </span>
              {org.is_80g_registered && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-pink-500/20 text-pink-300 text-xs font-bold border border-pink-500/30">
                  <FileText className="w-3 h-3 text-pink-400" />
                  Section 80G Tax Exemption
                </span>
              )}
              <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
                {org.category || "Social Welfare"}
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
              {org.legal_name}
            </h1>

            <p className="text-sm text-slate-300 leading-relaxed">
              {org.description ||
                "Registered non-governmental organization working towards grassroots community relief and development."}
            </p>

            <div className="flex items-center gap-4 text-xs text-slate-400 pt-2">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span>Verified Partner since {new Date(org.created_at).getFullYear()}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Direct Bank Settlement Enabled</span>
              </div>
            </div>
          </div>

          <div className="shrink-0 flex flex-col items-stretch sm:items-end gap-3">
            <button
              onClick={handleDonateToOrg}
              className="px-8 py-4 rounded-2xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white font-bold text-sm shadow-xl shadow-pink-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Heart className="w-4 h-4 fill-white" />
              <span>Donate Directly to Org</span>
            </button>
            <span className="text-[11px] text-slate-400 text-center sm:text-right">
              Tax exemption receipt issued instantly
            </span>
          </div>
        </div>
      </div>

      {/* Active Causes & Story Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-gray-900">
              Active Campaigns by {org.legal_name}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Specific emergency causes and projects managed by this organization.
            </p>
          </div>
          <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-bold">
            {activeCampaigns.length} Active {activeCampaigns.length === 1 ? "Cause" : "Causes"}
          </span>
        </div>

        {activeCampaigns.length === 0 ? (
          <div className="shopcart-card p-10 text-center bg-white space-y-4 border border-gray-100">
            <Heart className="w-12 h-12 text-pink-400 mx-auto" />
            <h3 className="font-bold text-base text-gray-900">No specific active campaigns</h3>
            <p className="text-xs text-gray-500 max-w-md mx-auto">
              All targeted campaign goals have been fulfilled. You can still support general operations and emergency relief funds directly.
            </p>
            <button
              onClick={handleDonateToOrg}
              className="px-6 py-2.5 rounded-full bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs transition-colors cursor-pointer"
            >
              Make a General Contribution
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeCampaigns.map((camp) => {
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
                    <div className="h-44 rounded-2xl overflow-hidden relative bg-gray-50">
                      <MediaThumb
                        src={img}
                        alt={camp.title}
                        className="object-cover group-hover:scale-105 transition-transform"
                      />
                      {camp.urgent && (
                        <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-red-600 text-white font-extrabold text-[10px] uppercase shadow-xs">
                          Urgent
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

                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <Link
                        href={`/donations/${camp.id}`}
                        className="py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs flex items-center justify-center transition-colors"
                      >
                        Details
                      </Link>
                      <button
                        onClick={() => handleDonateToCampaign(camp.id, camp.title)}
                        className="py-2.5 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-xs transition-colors cursor-pointer"
                      >
                        <span>Donate</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Trust & Tax Information Banner */}
      <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="flex items-start gap-3">
          <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0 mt-1" />
          <div>
            <h4 className="text-xs font-bold text-gray-900">100% Platform Verified</h4>
            <p className="text-xs text-gray-500 mt-0.5">
              Registration certificates, PAN, and bank accounts are manually verified by platform administrators.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <FileText className="w-6 h-6 text-pink-600 shrink-0 mt-1" />
          <div>
            <h4 className="text-xs font-bold text-gray-900">Section 80G Tax Deductible</h4>
            <p className="text-xs text-gray-500 mt-0.5">
              Eligible Indian resident donors receive formal 80G receipts for tax deductions under Income Tax laws.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <CheckCircle2 className="w-6 h-6 text-blue-600 shrink-0 mt-1" />
          <div>
            <h4 className="text-xs font-bold text-gray-900">Direct Disbursement</h4>
            <p className="text-xs text-gray-500 mt-0.5">
              Contributions are settled via batched payouts directly into the verified NGO bank account.
            </p>
          </div>
        </div>
      </div>

      {/* Donation Drawer/Modal */}
      <DonationModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        organization={org}
        campaignId={selectedCampaign.id}
        campaignTitle={selectedCampaign.title}
      />
    </div>
  );
}
