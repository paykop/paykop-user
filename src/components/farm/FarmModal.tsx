"use client";

import { useEffect, useState } from "react";
import {
  X,
  Sprout,
  ShieldCheck,
  Scale,
  Clock,
  ArrowRight,
  ExternalLink,
  Copy,
  Check,
  Smartphone,
  Layers,
  Sparkles,
} from "lucide-react";
import { launchFarmApp, FarmModalDetail } from "@/lib/farm/launch";
import { toast } from "@/lib/toast";

export function FarmModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [detail, setDetail] = useState<FarmModalDetail | null>(null);
  const [copied, setCopied] = useState(false);
  const [isLaunching, setIsLaunching] = useState(false);

  useEffect(() => {
    const handleOpen = (e: CustomEvent<FarmModalDetail>) => {
      setDetail(e.detail || null);
      setIsOpen(true);
    };

    window.addEventListener("paykop_open_farm_modal" as any, handleOpen);
    return () => window.removeEventListener("paykop_open_farm_modal" as any, handleOpen);
  }, []);

  if (!isOpen) return null;

  const handleLaunch = async () => {
    setIsLaunching(true);
    try {
      await launchFarmApp({
        productId: detail?.productId,
        fallbackToModal: false,
      });
      toast.success("Opening Paykop Farm App...");
    } finally {
      setIsLaunching(false);
    }
  };

  const handleCopyLink = () => {
    const link = detail?.deepLink || "paykopfarm://";
    navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success("Launch link copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-emerald-100 flex flex-col max-h-[90vh]">
        {/* Header Hero Banner */}
        <div className="bg-gradient-to-r from-[#1B5E20] to-[#2E7D32] text-white p-6 sm:p-7 relative">
          <button
            onClick={() => setIsOpen(false)}
            className="absolute top-4 right-4 p-2 rounded-full bg-black/20 hover:bg-black/40 text-white transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-emerald-200 text-xs font-bold uppercase tracking-wider mb-3">
            <Sprout className="w-3.5 h-3.5 text-emerald-300" />
            <span>Dedicated Agricultural Application</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2">
            Paykop Farm
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-400/30 text-emerald-100 border border-emerald-300/30">
              Separate App
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-emerald-100/90 mt-1 max-w-md">
            Agricultural produce, fresh farm harvest, and direct-from-farmer crops are exclusively managed in our specialized companion application.
          </p>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-800">
          {/* Ecosystem Separation Callout */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                <Layers className="w-4 h-4 text-emerald-700" />
                <span>Paykop (This App)</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                All-in-one single app for Retail, Electronics, Fashion, Home Services, Blood Bank, and Community Donations.
              </p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                <Sprout className="w-4 h-4 text-emerald-700" />
                <span>Paykop Farm (Separate App)</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Dedicated app for Fresh Vegetables, Fruits, Grains & Crops with weight-based orders (kg/g) and direct farmer supply.
              </p>
            </div>
          </div>

          {/* Key Advantages of Isolation */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Why Farm Produce has a Dedicated App
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <Scale className="w-4 h-4 text-emerald-700 mb-1" />
                <span className="text-xs font-bold text-slate-900 block">Metric Pricing</span>
                <span className="text-[11px] text-slate-500 block leading-tight">
                  Purchase by precise kg and fractional milli-units.
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <Clock className="w-4 h-4 text-emerald-700 mb-1" />
                <span className="text-xs font-bold text-slate-900 block">Harvest Freshness</span>
                <span className="text-[11px] text-slate-500 block leading-tight">
                  Track harvest dates and perishable 24h quality window.
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <ShieldCheck className="w-4 h-4 text-emerald-700 mb-1" />
                <span className="text-xs font-bold text-slate-900 block">Zero-Rate GST</span>
                <span className="text-[11px] text-slate-500 block leading-tight">
                  100% tax-exempt fresh agricultural produce.
                </span>
              </div>
            </div>
          </div>

          {/* Single Sign-On Assurance */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
              <Smartphone className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-xs font-bold text-slate-900 block">
                Single Sign-On (SSO) Enabled
              </span>
              <span className="text-[11px] text-slate-500 block">
                No new account needed. Your registered phone and addresses transfer instantly via secure 60s handoff.
              </span>
            </div>
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div className="p-6 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            onClick={handleCopyLink}
            type="button"
            className="w-full sm:w-auto px-4 py-3 rounded-full border border-slate-200 bg-white hover:bg-slate-100 text-xs font-bold text-slate-700 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? "Copied Link" : "Copy App Deep Link"}</span>
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setIsOpen(false)}
              type="button"
              className="w-full sm:w-auto px-4 py-3 rounded-full hover:bg-slate-200/60 text-xs font-bold text-slate-600 transition-colors cursor-pointer"
            >
              Stay in Paykop
            </button>

            <button
              onClick={handleLaunch}
              disabled={isLaunching}
              type="button"
              className="w-full sm:w-auto px-6 py-3 rounded-full bg-[#1B5E20] hover:bg-[#2E7D32] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              <span>{isLaunching ? "Launching..." : "Open Paykop Farm App"}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
