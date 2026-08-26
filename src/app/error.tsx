"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="max-w-lg mx-auto px-4 py-20 text-center space-y-4">
      <h2 className="text-2xl font-black text-gray-900 tracking-tight">Something went wrong</h2>
      <p className="text-sm text-gray-500">
        An unexpected error occurred. You can try again or return to the marketplace.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        <button
          type="button"
          onClick={reset}
          className="inline-flex px-6 py-3 rounded-full shopcart-btn-primary font-bold text-xs"
        >
          Try again
        </button>
        <Link
          href="/"
          className="inline-flex px-6 py-3 rounded-full border border-gray-200 font-bold text-xs text-gray-700 hover:bg-gray-50"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
