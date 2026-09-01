"use client";

import Link from "next/link";
import { Wrench, Calendar, MapPin, ChevronRight, Loader2 } from "lucide-react";
import { formatPaise } from "@/lib/money";
import { useBookings } from "@/lib/queries/hooks";

export default function BookingsPage() {
  const { data: bookings = [], isLoading: loading } = useBookings();

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <nav className="flex items-center gap-2 text-xs text-gray-500">
        <Link href="/" className="hover:text-gray-900">
          Home
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href="/account" className="hover:text-gray-900">
          Account
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="font-semibold text-gray-900">Service Bookings</span>
      </nav>

      <div className="pb-4 border-b border-gray-100">
        <h1 className="text-2xl font-black text-gray-900 tracking-tight">Service Appointments</h1>
        <p className="text-xs text-gray-500 mt-0.5">
          Track upcoming visits from neighborhood technicians and professionals
        </p>
      </div>

      {loading ? (
        <div className="py-20 text-center">
          <Loader2 className="w-8 h-8 text-[var(--primary)] animate-spin mx-auto" />
          <p className="text-xs text-gray-500 mt-2">Loading appointments...</p>
        </div>
      ) : bookings.length === 0 ? (
        <div className="shopcart-card p-12 text-center bg-white space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-[var(--primary)] flex items-center justify-center mx-auto">
            <Wrench className="w-8 h-8" />
          </div>
          <h3 className="font-bold text-lg text-gray-900">No service bookings found</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            Need an electrician, plumber, or cleaning pro? Explore our verified service catalogue.
          </p>
          <Link
            href="/services"
            className="inline-flex px-6 py-3 rounded-full shopcart-btn-primary text-xs font-bold"
          >
            Explore Services
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((b) => (
            <Link
              key={b.id}
              href={`/bookings/${b.id}`}
              className="shopcart-card p-6 bg-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 hover:border-[var(--primary)] transition-all block"
            >
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-gray-400">Booking #{b.id}</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-bold uppercase">
                    {b.status}
                  </span>
                </div>

                <h3 className="font-bold text-base text-gray-900">
                  {b.service?.title || `Service #${b.service_id}`}
                </h3>

                <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                    <span>{b.booking_time}</span>
                  </div>

                  {b.address && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-gray-400" />
                      <span className="truncate max-w-xs">{b.address}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto pt-4 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                <div className="text-right">
                  <span className="text-[10px] text-gray-400 block">Total Fee</span>
                  <span className="text-sm font-black text-[var(--primary)]">
                    {formatPaise(b.total_price || b.service?.fees || 0)}
                  </span>
                </div>

                {b.verification_otp && (
                  <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
                    <span className="text-[9px] font-bold text-emerald-800 uppercase block">
                      OTP
                    </span>
                    <span className="font-mono font-bold text-xs text-emerald-900">
                      {b.verification_otp}
                    </span>
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
