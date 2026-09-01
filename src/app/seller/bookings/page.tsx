"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Wrench,
  Calendar,
  MapPin,
  ChevronRight,
  Loader2,
  XCircle,
} from "lucide-react";
import { api } from "@/lib/api/endpoints";
import { session } from "@/lib/auth/session";
import { Booking } from "@/types";
import { formatPaise } from "@/lib/money";
import { toast } from "@/lib/toast";

export default function ProviderBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const loadBookings = () =>
    api.seller
      .getProviderBookings()
      .then((data) => setBookings(Array.isArray(data) ? data : []))
      .catch(() => setBookings([]))
      .finally(() => setLoading(false));

  const fetchBookings = ({ showLoading = false }: { showLoading?: boolean } = {}) => {
    if (showLoading) setLoading(true);
    return loadBookings();
  };

  useEffect(() => {
    if (!session.isAuthenticated()) return;
    loadBookings();
  }, []);

  const handleUpdateStatus = async (bookingId: number, newStatus: string) => {
    setUpdatingId(bookingId);
    try {
      await api.seller.updateBookingStatus(bookingId, newStatus);
      fetchBookings({ showLoading: true });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update booking status");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-gray-500">
        <Link href="/" className="hover:text-gray-900">
          Home
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href="/seller" className="hover:text-gray-900">
          Seller Hub
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="font-semibold text-gray-900">Service Appointments</span>
      </nav>

      {/* Header */}
      <div className="pb-4 border-b border-gray-100">
        <h1 className="text-2xl font-black text-gray-900 tracking-tight">
          Customer Service Appointments
        </h1>
        <p className="text-xs text-gray-500 mt-0.5">
          Manage and update status for neighborhood service bookings
        </p>
      </div>

      {loading ? (
        <div className="py-20 text-center">
          <Loader2 className="w-8 h-8 text-[var(--primary)] animate-spin mx-auto" />
          <p className="text-xs text-gray-500 mt-2">Loading provider appointments...</p>
        </div>
      ) : bookings.length === 0 ? (
        <div className="shopcart-card p-12 text-center bg-white space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-[var(--primary)] flex items-center justify-center mx-auto">
            <Wrench className="w-8 h-8" />
          </div>
          <h3 className="font-bold text-lg text-gray-900">No appointments scheduled yet</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            When neighborhood customers book your services, appointment requests will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((b) => {
            const isUpdating = updatingId === b.id;

            return (
              <div
                key={b.id}
                className="shopcart-card p-6 bg-white flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-gray-200"
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
                        <span>{b.address}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Status Update Controls */}
                <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3 w-full md:w-auto pt-4 md:pt-0 border-t md:border-t-0 border-gray-100">
                  <div className="text-left sm:text-right sm:mr-2">
                    <span className="text-[10px] text-gray-400 block">Fee</span>
                    <span className="text-sm font-black text-[var(--primary)]">
                      {formatPaise(b.total_price || b.service?.fees || 0)}
                    </span>
                  </div>

                  {b.status !== "completed" && b.status !== "cancelled" && (
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => handleUpdateStatus(b.id, "confirmed")}
                        disabled={isUpdating || b.status === "confirmed"}
                        className="px-3.5 py-2 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold hover:bg-emerald-100 disabled:opacity-40 cursor-pointer"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(b.id, "completed")}
                        disabled={isUpdating}
                        className="px-3.5 py-2 rounded-xl shopcart-btn-primary text-xs font-bold cursor-pointer"
                      >
                        Mark Completed
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(b.id, "cancelled")}
                        disabled={isUpdating}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                        title="Cancel Booking"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
