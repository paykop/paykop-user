"use client";

import Link from "next/link";
import { MediaThumb } from "@/components/ui/MediaThumb";
import { HandHeart, Users, ArrowRight, Loader2, ChevronRight } from "lucide-react";
import { formatPaise } from "@/lib/money";
import { useDonations } from "@/lib/queries/hooks";

export default function DonationsPage() {
  const { data: campaigns = [], isLoading: loading } = useDonations();

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
      <div className="rounded-3xl bg-[var(--primary)] text-white p-8 sm:p-10 relative overflow-hidden shadow-md">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/20 text-pink-300 text-xs font-bold">
            <HandHeart className="w-3.5 h-3.5" />
            <span>100% Verified Community Causes</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
            Support Local Emergency Relief & Causes
          </h1>
          <p className="text-sm text-white/80">
            Direct transparent donations for medical treatments, local disaster relief, and child welfare.
          </p>
        </div>
      </div>

      {/* Campaigns Grid */}
      {loading ? (
        <div className="py-20 text-center">
          <Loader2 className="w-8 h-8 text-[var(--primary)] animate-spin mx-auto" />
          <p className="text-xs text-gray-500 mt-2">Loading active campaigns...</p>
        </div>
      ) : campaigns.length === 0 ? (
        <div className="shopcart-card p-12 text-center bg-white space-y-4">
          <HandHeart className="w-12 h-12 text-pink-400 mx-auto" />
          <h3 className="font-bold text-lg text-gray-900">No active campaigns right now</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            All current community relief goals have been met. Thank you for your support!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {campaigns.map((camp) => {
            const target = camp.target_amount || 1;
            const raised = camp.raised_amount || 0;
            const pct = Math.min(100, Math.round((raised / target) * 100));
            const img =
              camp.image ||
              camp.image_url ||
              null;

            return (
              <div
                key={camp.id}
                className="shopcart-card p-5 bg-white flex flex-col justify-between space-y-4 hover:border-pink-300 transition-all group"
              >
                <div className="space-y-3">
                  <div className="h-48 rounded-2xl overflow-hidden relative bg-gray-50">
                    <MediaThumb src={img} alt={camp.title} className="object-cover group-hover:scale-105 transition-transform" />
                    {camp.urgent && (
                      <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-red-600 text-white font-extrabold text-[10px] uppercase shadow-sm">
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
    </div>
  );
}
