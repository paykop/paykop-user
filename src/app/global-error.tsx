"use client";

import { captureException } from "@/lib/sentry";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md text-center space-y-4">
          <h2 className="text-2xl font-black text-gray-900">Something went wrong</h2>
          <p className="text-sm text-gray-500">A critical error occurred. Please try again.</p>
          <button
            type="button"
            onClick={reset}
            className="px-6 py-3 rounded-full bg-emerald-700 text-white font-bold text-xs"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
