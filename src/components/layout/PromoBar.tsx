"use client";

import { Phone, MapPin } from "lucide-react";
import { useLocationStore } from "@/lib/location/store";
import { useHomeFeed } from "@/lib/queries/hooks";

const supportPhone = process.env.NEXT_PUBLIC_SUPPORT_PHONE;

export function PromoBar() {
  const { cityName, latitude, longitude, openModal } = useLocationStore();
  const { data } = useHomeFeed(latitude || undefined, longitude || undefined);
  const promoText = data?.banners?.[0]?.title || data?.locationMessage;

  return (
    <div className="bg-[var(--primary)] text-white text-xs py-2 px-3 sm:px-4 border-b border-[var(--primary-dark)]/40">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2 min-w-0">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
          {supportPhone ? (
            <a
              href={`tel:${supportPhone.replace(/\s/g, "")}`}
              className="flex items-center gap-1.5 hover:text-[var(--accent-green)] transition-colors shrink-0"
            >
              <Phone className="w-3.5 h-3.5 text-[var(--accent-green)]" />
              <span className="hidden sm:inline">{supportPhone}</span>
            </a>
          ) : null}
          {promoText ? (
            <span className="truncate text-white/90 min-w-0">{promoText}</span>
          ) : (
            <span className="truncate text-white/90 min-w-0">Hyperlocal marketplace in {cityName}</span>
          )}
        </div>

        <button
          onClick={openModal}
          className="flex items-center gap-1 hover:text-[var(--accent-green)] transition-colors font-medium cursor-pointer shrink-0 max-w-full"
        >
          <MapPin className="w-3.5 h-3.5 text-[var(--accent-green)]" />
          <span className="truncate">
            <span className="hidden sm:inline">Location: </span>
            <span className="underline decoration-[var(--accent-green)]">{cityName}</span>
          </span>
        </button>
      </div>
    </div>
  );
}
