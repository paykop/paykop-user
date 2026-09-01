"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Loader2, KeyRound } from "lucide-react";
import { api } from "@/lib/api/endpoints";
import { Booking } from "@/types";
import { formatPaise } from "@/lib/money";
import { toast } from "@/lib/toast";

export default function BookingDetailPage() {
  const params = useParams();
  const bookingId = params.id as string;
  const [booking, setBooking] = useState<Booking | null>(null);
  const [statusLabel, setStatusLabel] = useState("");
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);

  useEffect(() => {
    Promise.all([
      api.services.getBookingById(bookingId).catch(() => null),
      api.services.getBookingStatus(bookingId).catch(() => null),
    ])
      .then(([b, st]) => {
        setBooking(b);
        setStatusLabel(st?.status ?? b?.status ?? "");
      })
      .finally(() => setLoading(false));
  }, [bookingId]);

  const handleRegenerateOtp = async () => {
    setRegenerating(true);
    try {
      const res = await api.services.regenerateBookingOtp(bookingId);
      setBooking((prev) =>
        prev ? { ...prev, verification_otp: res.verification_otp } : prev
      );
      toast.success("Verification OTP regenerated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to regenerate OTP");
    } finally {
      setRegenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center">
        <Loader2 className="w-8 h-8 text-[var(--primary)] animate-spin mx-auto" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <h2 className="text-xl font-bold">Booking not found</h2>
        <Link href="/bookings" className="text-sm text-[var(--primary)] font-bold mt-2 inline-block">
          Back to bookings
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <nav className="flex items-center gap-2 text-xs text-gray-500">
        <Link href="/bookings" className="hover:text-gray-900">
          Bookings
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="font-semibold text-gray-900">#{booking.id}</span>
      </nav>

      <div className="shopcart-card p-6 bg-white space-y-4">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-xl font-black text-gray-900">
              {booking.service?.title || `Service #${booking.service_id}`}
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              {new Date(booking.booking_time).toLocaleString()}
            </p>
          </div>
          <span className="text-[10px] font-bold uppercase px-2 py-1 rounded-full bg-gray-100">
            {statusLabel || booking.status}
          </span>
        </div>
        <p className="text-sm font-bold text-[var(--primary)]">{formatPaise(booking.total_price)}</p>
        {booking.address && <p className="text-xs text-gray-600">{booking.address}</p>}
        {booking.notes && <p className="text-xs text-gray-500">{booking.notes}</p>}
      </div>

      {booking.verification_otp && (
        <div className="p-5 rounded-2xl bg-[var(--primary)] text-white flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <KeyRound className="w-5 h-5" />
            <span className="text-sm font-bold">Verification OTP</span>
          </div>
          <span className="font-mono text-xl font-black">{booking.verification_otp}</span>
        </div>
      )}

      <button
        type="button"
        onClick={handleRegenerateOtp}
        disabled={regenerating}
        className="px-5 py-2.5 rounded-full shopcart-btn-primary text-xs font-bold cursor-pointer disabled:opacity-50"
      >
        Regenerate OTP
      </button>
    </div>
  );
}
