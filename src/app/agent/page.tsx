"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Briefcase, ChevronRight, Loader2, Plus, Users, Sparkles } from "lucide-react";
import { api } from "@/lib/api/endpoints";
import { AgentSellerSummary } from "@/types";
import { AgentGate } from "@/components/agent/AgentGate";

function AgentHubContent() {
  const [sellers, setSellers] = useState<AgentSellerSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.agent
      .listSellers()
      .then((res) => setSellers(res.sellers || []))
      .catch(() => setSellers([]))
      .finally(() => setLoading(false));
  }, []);

  const onboarded = sellers.filter((s) => s.is_onboarded).length;
  const subscribed = sellers.filter((s) => s.has_subscription).length;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <nav className="flex items-center gap-2 text-xs text-gray-500">
        <Link href="/" className="hover:text-gray-900">
          Home
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="font-semibold text-gray-900">Agent Hub</span>
      </nav>

      <div className="rounded-3xl bg-[var(--primary)] text-white p-8 sm:p-10 relative overflow-hidden shadow-lg">
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--accent-green)]/20 text-[var(--accent-green)] text-xs font-bold">
            <Briefcase className="w-3.5 h-3.5" />
            <span>Field Agent Portal</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight">Onboard neighborhood sellers</h1>
          <p className="text-sm text-white/80">
            Create sellers, set locations, grant trials, and list products or services on their behalf.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href="/agent/sellers"
              className="px-6 py-3 rounded-full bg-[var(--accent-green)] text-[var(--primary-dark)] font-bold text-xs flex items-center gap-2 shadow-md"
            >
              <Users className="w-4 h-4" />
              Managed sellers
            </Link>
            <Link
              href="/agent/sellers?new=1"
              className="px-6 py-3 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create seller
            </Link>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center">
          <Loader2 className="w-8 h-8 text-[var(--primary)] animate-spin mx-auto" />
          <p className="text-xs text-gray-500 mt-2">Loading your managed sellers...</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="shopcart-card p-5 bg-white space-y-1">
              <div className="text-xs font-bold uppercase tracking-wider text-gray-400">Managed</div>
              <div className="text-3xl font-black text-gray-900">{sellers.length}</div>
              <div className="text-xs text-gray-500">Sellers assigned to you</div>
            </div>
            <div className="shopcart-card p-5 bg-white space-y-1">
              <div className="text-xs font-bold uppercase tracking-wider text-gray-400">Onboarded</div>
              <div className="text-3xl font-black text-gray-900">{onboarded}</div>
              <div className="text-xs text-gray-500">Completed profile setup</div>
            </div>
            <div className="shopcart-card p-5 bg-white space-y-1">
              <div className="text-xs font-bold uppercase tracking-wider text-gray-400">Subscribed</div>
              <div className="text-3xl font-black text-gray-900">{subscribed}</div>
              <div className="text-xs text-gray-500">Active or trial plans</div>
            </div>
          </div>

          <div className="shopcart-card p-6 bg-white space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[var(--accent-green)]" />
                Recent sellers
              </h2>
              <Link href="/agent/sellers" className="text-xs font-bold text-[var(--primary)] hover:underline">
                View all
              </Link>
            </div>
            {sellers.length === 0 ? (
              <p className="text-sm text-gray-500 py-6 text-center">
                No managed sellers yet. Create your first seller to get started.
              </p>
            ) : (
              <div className="divide-y divide-gray-100">
                {sellers.slice(0, 5).map((seller) => (
                  <Link
                    key={seller.id}
                    href={`/agent/sellers/${seller.id}`}
                    className="flex items-center justify-between py-3 hover:bg-gray-50 -mx-2 px-2 rounded-xl"
                  >
                    <div>
                      <div className="font-bold text-sm text-gray-900">
                        {seller.first_name} {seller.last_name}
                      </div>
                      <div className="text-xs text-gray-500">{seller.phone || seller.email || seller.id}</div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default function AgentHubPage() {
  return (
    <AgentGate>
      <AgentHubContent />
    </AgentGate>
  );
}
