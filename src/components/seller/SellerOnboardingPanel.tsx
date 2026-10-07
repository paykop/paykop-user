"use client";

import Link from "next/link";
import { ChevronRight, MapPin, ShieldCheck, Store, CreditCard, UserCircle } from "lucide-react";
import {
  deriveWizardStep,
  isOnboardingComplete,
  onboardingStepHref,
  SELLER_WIZARD_STEPS,
  wizardStepIndex,
  type OnboardingSubject,
  type SellerWizardStep,
} from "@/lib/seller/onboarding";

const STEP_ICONS: Record<SellerWizardStep, typeof Store> = {
  complete_profile: UserCircle,
  choose_subscription: CreditCard,
  complete_subscription_payment: CreditCard,
  complete_kyc: ShieldCheck,
  await_kyc_review: ShieldCheck,
  set_business_location: MapPin,
  listings: Store,
};

function stepDescription(step: SellerWizardStep): string {
  switch (step) {
    case "complete_profile":
      return "Complete your profile to start selling.";
    case "choose_subscription":
      return "Choose a seller plan (Commission activates instantly).";
    case "complete_subscription_payment":
      return "Finish payment for your selected plan.";
    case "complete_kyc":
      return "Upload KYC documents required for your category.";
    case "await_kyc_review":
      return "KYC is with our team for review. You will be notified when verified.";
    case "set_business_location":
      return "Add your business location so buyers can find you.";
    case "listings":
      return "You can list products and services — listings go live immediately.";
    default:
      return "";
  }
}

export function SellerOnboardingPanel({ subject }: { subject: OnboardingSubject }) {
  const activeStep = deriveWizardStep(subject);
  if (isOnboardingComplete(activeStep)) {
    return null;
  }

  const href = onboardingStepHref(activeStep);
  const currentIndex = wizardStepIndex(activeStep);
  const Icon = STEP_ICONS[activeStep] ?? Store;

  return (
    <div className="rounded-3xl border border-amber-200 bg-amber-50/80 p-5 sm:p-6 space-y-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-2xl bg-amber-200/60 text-amber-900 flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-wide text-amber-800">Seller onboarding</p>
          <p className="text-sm font-bold text-amber-950 mt-0.5">{stepDescription(activeStep)}</p>
          {href && (
            <Link
              href={href}
              className="inline-flex items-center gap-1 mt-2 text-xs font-bold text-amber-900 underline"
            >
              Continue this step
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>
      </div>

      <ol className="flex flex-wrap gap-2">
        {SELLER_WIZARD_STEPS.map((s, idx) => {
          const done = idx < currentIndex;
          const current = s.id === activeStep || (activeStep === "complete_subscription_payment" && s.id === "choose_subscription");
          return (
            <li
              key={s.id}
              className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                done
                  ? "bg-emerald-100 text-emerald-800"
                  : current
                    ? "bg-amber-200 text-amber-950"
                    : "bg-white/70 text-amber-700/80"
              }`}
            >
              {s.label}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
