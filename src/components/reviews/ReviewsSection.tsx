"use client";

import { useState } from "react";
import { session } from "@/lib/auth/session";
import { api } from "@/lib/api/endpoints";
import { Review } from "@/types";
import { useProductReviews, useServiceReviews } from "@/lib/queries/hooks";
import { toast } from "@/lib/toast";
import { Star } from "lucide-react";

type Props = {
  targetType: "product" | "service";
  targetId: number | string;
  embedded?: Review[];
};

export function ReviewsSection({ targetType, targetId, embedded = [] }: Props) {
  const productReviews = useProductReviews(targetType === "product" ? targetId : "");
  const serviceReviews = useServiceReviews(targetType === "service" ? targetId : "");
  const query = targetType === "product" ? productReviews : serviceReviews;
  const reviews = (query.data?.length ? query.data : embedded) ?? [];

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session.isAuthenticated()) {
      toast.error("Sign in to leave a review");
      return;
    }
    setSubmitting(true);
    try {
      if (targetType === "product") {
        await api.reviews.createProductReview(targetId, { rating, comment });
      } else {
        await api.reviews.createServiceReview(targetId, { rating, comment });
      }
      toast.success("Review submitted");
      setComment("");
      query.refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="shopcart-card p-6 bg-white space-y-4">
      <h3 className="font-black text-base text-gray-900">Reviews ({reviews.length})</h3>
      {reviews.length === 0 ? (
        <p className="text-xs text-gray-500">No reviews yet.</p>
      ) : (
        <ul className="space-y-3">
          {reviews.map((r) => (
            <li key={r.id} className="border-b border-gray-100 pb-3 last:border-0">
              <div className="flex items-center gap-1 text-amber-500">
                {Array.from({ length: r.rating }).map((_, i) => (
                  <Star key={i} className="w-3 h-3 fill-current" />
                ))}
              </div>
              <p className="text-sm text-gray-800 mt-1">{r.comment}</p>
              <p className="text-[10px] text-gray-400 mt-1">{r.user_email || "Buyer"}</p>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleSubmit} className="pt-3 border-t border-gray-100 space-y-2">
        <p className="text-xs font-bold text-gray-700">Write a review</p>
        <select
          value={rating}
          onChange={(e) => setRating(Number(e.target.value))}
          className="px-3 py-2 rounded-xl border border-gray-200 text-xs"
        >
          {[5, 4, 3, 2, 1].map((n) => (
            <option key={n} value={n}>
              {n} stars
            </option>
          ))}
        </select>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share your experience"
          className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm"
          rows={2}
          required
        />
        <button
          type="submit"
          disabled={submitting}
          className="px-4 py-2 rounded-full shopcart-btn-primary text-xs font-bold cursor-pointer disabled:opacity-50"
        >
          Submit review
        </button>
      </form>
    </div>
  );
}
