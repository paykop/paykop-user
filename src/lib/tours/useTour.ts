"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { Driver } from "driver.js";
import { TourId, UseTourOptions, TourHookReturn } from "./types";
import { TOURS_REGISTRY } from "./tours";

const COMPLETED_TOURS_STORAGE_KEY = "paykop_completed_tours";

export function getCompletedTours(): string[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(COMPLETED_TOURS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function isTourCompleted(tourId: TourId): boolean {
  return getCompletedTours().includes(tourId);
}

export function markTourCompleted(tourId: TourId): void {
  if (typeof localStorage === "undefined") return;
  try {
    const current = getCompletedTours();
    if (!current.includes(tourId)) {
      const updated = [...current, tourId];
      localStorage.setItem(COMPLETED_TOURS_STORAGE_KEY, JSON.stringify(updated));
    }
  } catch {
    // Ignore localStorage quota / private browsing errors
  }
}

export function resetTourCompleted(tourId: TourId): void {
  if (typeof localStorage === "undefined") return;
  try {
    const current = getCompletedTours();
    const updated = current.filter((id) => id !== tourId);
    localStorage.setItem(COMPLETED_TOURS_STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // Ignore
  }
}

export function useTour(tourId: TourId, options: UseTourOptions = {}): TourHookReturn {
  const { autoStart = false, delayMs = 800, onComplete } = options;
  const [isCompleted, setIsCompleted] = useState(() => isTourCompleted(tourId));
  const [isRunning, setIsRunning] = useState(false);
  const [driverInstance, setDriverInstance] = useState<Driver | null>(null);
  const driverInstanceRef = useRef<Driver | null>(null);

  const stopTour = useCallback(() => {
    if (driverInstanceRef.current) {
      driverInstanceRef.current.destroy();
      driverInstanceRef.current = null;
      setDriverInstance(null);
    }
    setIsRunning(false);
  }, []);

  const startTour = useCallback(async () => {
    const tourDef = TOURS_REGISTRY[tourId];
    if (!tourDef) {
      console.warn(`[useTour] Unknown tour ID: "${tourId}"`);
      return;
    }

    // Bug 2 fix: driver.js is a module-level singleton. Destroy any active instance before instantiating.
    if (driverInstanceRef.current) {
      driverInstanceRef.current.destroy();
      driverInstanceRef.current = null;
      setDriverInstance(null);
    }

    try {
      const [{ driver }] = await Promise.all([
        import("driver.js"),
        import("driver.js/dist/driver.css"),
      ]);

      const instance = driver({
        ...tourDef.config,
        steps: tourDef.steps,
        onDestroyStarted: () => {
          // Traced contract: Calling public .destroy() from within onDestroyStarted
          // sets internal flag to skip re-running onDestroyStarted, preventing infinite recursion.
          instance.destroy();
          markTourCompleted(tourId);
          setIsCompleted(true);
          setIsRunning(false);
          driverInstanceRef.current = null;
          setDriverInstance(null);
          onComplete?.();
        },
      });

      driverInstanceRef.current = instance;
      setDriverInstance(instance);
      setIsRunning(true);
      instance.drive();
    } catch (err) {
      console.error(`[useTour] Failed to start tour "${tourId}":`, err);
      setIsRunning(false);
      driverInstanceRef.current = null;
      setDriverInstance(null);
    }
  }, [tourId, onComplete]);

  const resetTour = useCallback(() => {
    stopTour();
    resetTourCompleted(tourId);
    setIsCompleted(false);
  }, [tourId, stopTour]);

  // Handle auto-start and React 19 StrictMode double-mount cycle
  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    if (autoStart && !isTourCompleted(tourId)) {
      timer = setTimeout(() => {
        if (!cancelled) {
          void startTour();
        }
      }, delayMs);
    }

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      if (driverInstanceRef.current) {
        driverInstanceRef.current.destroy();
        driverInstanceRef.current = null;
      }
    };
  }, [autoStart, delayMs, tourId, startTour]);

  return {
    startTour,
    stopTour,
    isCompleted,
    isRunning,
    resetTour,
    driverInstance,
  };
}
