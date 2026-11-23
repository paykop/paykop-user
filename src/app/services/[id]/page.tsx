"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { MediaThumb } from "@/components/ui/MediaThumb";
import { ReviewsSection } from "@/components/reviews/ReviewsSection";
import Link from "next/link";
import {
  Star,
  Clock,
  Calendar,
  ShieldCheck,
  ChevronRight,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { api } from "@/lib/api/endpoints";
import { session } from "@/lib/auth/session";
import { ServiceItem } from "@/types";
import { formatPaise } from "@/lib/money";
import { RazorpayCheckout } from "@/components/checkout/RazorpayCheckout";

export default function ServiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const serviceId = params.id as string;

  const [service, setService] = useState<ServiceItem | null>(null);
  const [loading, setLoading] = useState(true);

  // Booking Form State
  const [bookingDate, setBookingDate] = useState("");
  const [bookingTime, setBookingTime] = useState("10:00 AM");
  const [address, setAddress] = useState(() => session.getUser()?.address || "");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdBookingId, setCreatedBookingId] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    api.services
      .getById(serviceId)
      .then((data) => {
        setService(data);
      })
      .catch(() => setService(null))
      .finally(() => setLoading(false));
  }, [serviceId]);

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!session.isAuthenticated()) {
      window.dispatchEvent(new CustomEvent("paykop_open_login"));
      return;
    }

    if (!bookingDate || !address.trim()) {
      setErrorMsg("Please select a date and enter your appointment address.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");

    const scheduledTime = `${bookingDate} ${bookingTime}`;

    try {
      const booking = await api.services.createBooking({
        service_id: Number(serviceId),
        booking_time: scheduledTime,
        address: address.trim(),
        notes: notes.trim() || undefined,
      });

      setCreatedBookingId(booking.id);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to create booking. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-[var(--primary)] animate-spin" />
        <p className="text-xs text-gray-500 mt-2">Loading service details...</p>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-xl font-bold text-gray-900">Service Not Found</h2>
        <Link href="/services" className="inline-flex px-6 py-3 rounded-full shopcart-btn-primary text-xs font-bold">
          View All Services
        </Link>
      </div>
    );
  }

  const img =
    service.image ||
    (service.images && service.images.length > 0 ? service.images[0] : null) ||
    null;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-gray-500">
        <Link href="/" className="hover:text-gray-900">
          Home
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href="/services" className="hover:text-gray-900">
          Services
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="font-semibold text-gray-900 truncate">{service.title}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Service info */}
        <div className="lg:col-span-7 space-y-6">
          <div className="relative pt-[60%] rounded-3xl overflow-hidden bg-gray-50 border border-gray-100 shadow-sm">
            <MediaThumb src={img} alt={service.title} className="object-cover" />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[var(--primary)] bg-emerald-50 px-3 py-1 rounded-full uppercase">
                {service.category?.name || "Verified Service"}
              </span>
              <div className="flex items-center gap-1 text-sm font-semibold text-gray-700 bg-gray-50 px-3 py-1 rounded-full">
                <Star className="w-4 h-4 fill-[#ffc220] text-[#ffc220]" />
                <span>{(service.avg_rating || service.rating || 4.9).toFixed(1)}</span>
                <span className="text-gray-400 text-xs">({service.review_count || 0} reviews)</span>
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
              {service.title}
            </h1>

            <p className="text-sm text-gray-600 leading-relaxed">{service.description}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-white border border-gray-200 space-y-1">
              <Clock className="w-4 h-4 text-emerald-700" />
              <div className="font-bold text-gray-900">Operating Hours</div>
              <div className="text-gray-500">{service.operating_hours || "9:00 AM - 8:00 PM (Mon-Sat)"}</div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-gray-200 space-y-1">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <div className="font-bold text-gray-900">Service Guarantee</div>
              <div className="text-gray-500">Verified & Background-Checked</div>
            </div>
          </div>
        </div>

        {/* Right: Booking Form Card */}
        <div className="lg:col-span-5 shopcart-card p-6 bg-white space-y-6">
          <div>
            <h3 className="font-black text-lg text-gray-900">Book Appointment</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Service Fee: <strong className="text-[var(--primary)] text-base">{formatPaise(service.fees)}</strong>
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-100">
              {errorMsg}
            </div>
          )}

          {createdBookingId ? (
            <div className="space-y-4 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
              <div className="space-y-1">
                <h4 className="font-bold text-sm text-emerald-900">Booking Slot Reserved!</h4>
                <p className="text-xs text-emerald-700">
                  Booking #{createdBookingId} is pending payment verification. Complete payment below.
                </p>
              </div>

              <RazorpayCheckout
                bookingId={createdBookingId}
                amountPaise={service.fees}
                title={`Booking: ${service.title}`}
                onSuccess={() => {
                  router.push(`/bookings?success=true`);
                }}
                buttonText={`Pay ${formatPaise(service.fees)} via Razorpay`}
              />
            </div>
          ) : (
            <form onSubmit={handleCreateBooking} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Time Slot *
                  </label>
                  <select
                    value={bookingTime}
                    onChange={(e) => setBookingTime(e.target.value)}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium"
                  >
                    <option>09:00 AM</option>
                    <option>10:00 AM</option>
                    <option>11:30 AM</option>
                    <option>02:00 PM</option>
                    <option>04:00 PM</option>
                    <option>06:00 PM</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Service Address *
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Where should the professional visit?"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Additional Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Specific model, issue description"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 px-4 rounded-full shopcart-btn-primary font-bold text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[var(--accent-green)]" />
                    <span>Reserving slot...</span>
                  </>
                ) : (
                  <>
                    <span>Confirm & Proceed to Payment</span>
                    <Calendar className="w-3.5 h-3.5 text-[var(--accent-green)]" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>

      {service && (
        <ReviewsSection targetType="service" targetId={service.id} />
      )}
    </div>
  );
}
