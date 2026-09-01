"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect, ReactNode } from "react";
import { useLocationStore } from "@/lib/location/store";
import { AppToaster } from "@/components/ui/Toaster";
import { initSentry } from "@/lib/sentry";

function LocationHydrator() {
  const hydrateFromStorage = useLocationStore((s) => s.hydrateFromStorage);

  useEffect(() => {
    initSentry();
    hydrateFromStorage();
  }, [hydrateFromStorage]);

  return null;
}

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <LocationHydrator />
      <AppToaster />
      {children}
    </QueryClientProvider>
  );
}
