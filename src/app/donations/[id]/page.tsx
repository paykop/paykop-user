"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { MediaThumb } from "@/components/ui/MediaThumb";
import Link from "next/link";
import {
  ShieldCheck,
  ChevronRight,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { api } from "@/lib/api/endpoints";
import { DonationCampaign, OrganizationPublic } from "@/types";
import { formatPaise, rupeesToPaise } from "@/lib/money";
import { DonationModal } from "@/components/donations/DonationModal";
import { toast } from "@/lib/toast";

export default function CampaignDetailPage() {
  const params = useParams();
  const campaignId = params.id as string;

  const [campaign, setCampaign] = useState<DonationCampaign | null>(null);
  const [org, setOrg] = useState<OrganizationPublic | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRupees, setSelectedRupees] = useState(1000);
  const [customRupees, setCustomRupees] = useState("");
  const [donationSuccess, setDonationSuccess] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    api.donations
      .getCampaignById(campaignId)
      .then(async (data) => {
        setCampaign(data);
        if (data?.org_id) {
          try {
            const orgDetail = await api.donations.getOrganizationById(data.org_id);
            setOrg(orgDetail);
          } catch (e) {
            console.error("Failed to load organization for campaign:", e);
          }
        } else {
          try {
            const orgList = await api.donations.listOrganizations(1, 1);
            if (orgList?.organizations && orgList.organizations.length > 0) {
              setOrg(orgList.organizations[0]);
            }
          } catch (e) {
            console.error("Failed to load fallback organization:", e);
          }
        }
      })
      .catch(() => setCampaign(null))
      .finally(() => setLoading(false));
  }, [campaignId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-[var(--primary)] animate-spin" />
        <p className="text-xs text-gray-500 mt-2">Loading campaign story...</p>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-xl font-bold text-gray-900">Campaign Not Found</h2>
        <Link href="/donations" className="inline-flex px-6 py-3 rounded-full shopcart-btn-primary text-xs font-bold">
          View All Campaigns
        </Link>
      </div>
    );
  }

  const target = campaign.target_amount || 1;
  const raised = campaign.raised_amount || 0;
  const pct = Math.min(100, Math.round((raised / target) * 100));
  const img =
    campaign.image ||
    campaign.image_url ||
    null;

  const effectiveRupees = customRupees ? Number(customRupees) : selectedRupees;
  const effectivePaise = rupeesToPaise(effectiveRupees);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-gray-500">
        <Link href="/" className="hover:text-gray-900">
          Home
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href="/donations" className="hover:text-gray-900">
          Donations
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="font-semibold text-gray-900 truncate">{campaign.title}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Story and Details */}
        <div className="lg:col-span-7 space-y-6">
          <div className="relative pt-[60%] rounded-3xl overflow-hidden bg-gray-50 border border-gray-100 shadow-sm">
            <MediaThumb src={img} alt={campaign.title} className="object-cover" />
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-pink-700 bg-pink-50 px-3 py-1 rounded-full uppercase">
                {campaign.urgent ? "Emergency Cause" : "Verified Charity"}
              </span>
              <span className="text-xs text-gray-500">Beneficiary: Local Community</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
              {campaign.title}
            </h1>

            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
              {campaign.description}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-gray-200 flex items-center gap-3 text-xs text-gray-600">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <span className="font-bold text-gray-900 block">100% Direct Disbursement</span>
              <span>All contributions are transferred directly to medical / relief institutions.</span>
            </div>
          </div>
        </div>

        {/* Right: Donation Execution Card */}
        <div className="lg:col-span-5 shopcart-card p-6 bg-white space-y-6">
          <div className="space-y-2">
            <h3 className="font-black text-lg text-gray-900">Make a Direct Contribution</h3>

            {/* Progress */}
            <div className="w-full h-3 bg-pink-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-pink-600 rounded-full transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-pink-600">{formatPaise(raised)} raised</span>
              <span className="text-gray-400">Target: {formatPaise(target)}</span>
            </div>

            <div className="flex items-center justify-between text-xs text-gray-500 pt-1">
              <span>{campaign.donor_count || 0} donors joined</span>
              <span className="font-bold text-emerald-700">{pct}% funded</span>
            </div>
          </div>

          {donationSuccess ? (
            <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
              <h4 className="font-bold text-base text-emerald-900">Thank You for Your Generosity!</h4>
              <p className="text-xs text-emerald-700">
                Your donation of ₹{effectiveRupees} has been securely verified and processed.
              </p>
              <Link
                href="/donations"
                className="inline-block px-5 py-2.5 rounded-full shopcart-btn-primary text-xs font-bold"
              >
                Explore Other Causes
              </Link>
            </div>
          ) : (
            <div className="space-y-4 pt-2 border-t border-gray-100">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">
                  Select Donation Amount (INR)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[500, 1000, 2500, 5000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => {
                        setSelectedRupees(amt);
                        setCustomRupees("");
                      }}
                      className={`py-2 px-1 rounded-xl text-xs font-bold transition-all cursor-pointer text-center ${
                        selectedRupees === amt && !customRupees
                          ? "bg-pink-600 text-white shadow-xs"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      ₹{amt}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Or Enter Custom Amount (₹)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 1500"
                  min={50}
                  value={customRupees}
                  onChange={(e) => setCustomRupees(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-900"
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  if (!org) {
                    toast.error("Organization details are still loading. Please try again in a moment.");
                    return;
                  }
                  setModalOpen(true);
                }}
                className="w-full py-4 px-6 rounded-full bg-pink-600 hover:bg-pink-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-colors cursor-pointer"
              >
                Donate ₹{effectiveRupees} Securely
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Verified Donation Modal */}
      {org && (
        <DonationModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          organization={org}
          campaignId={Number(campaignId)}
          campaignTitle={campaign.title}
          defaultAmountRupees={effectiveRupees}
          onSuccess={() => {
            setDonationSuccess(true);
            api.donations
              .getCampaignById(campaignId)
              .then((data) => setCampaign(data))
              .catch(() => {});
          }}
        />
      )}
    </div>
  );
}
