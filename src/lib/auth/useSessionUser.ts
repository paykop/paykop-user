"use client";

import { useSyncExternalStore } from "react";
import { session } from "./session";
import { User } from "@/types";

const USER_KEY = "paykop_user";

let cachedUser: User | null = null;
let cachedUserRaw: string | null | undefined;

function getUserSnapshot(): User | null {
  if (typeof window === "undefined") return null;

  const raw = localStorage.getItem(USER_KEY);
  if (raw === cachedUserRaw) {
    return cachedUser;
  }

  cachedUserRaw = raw;
  if (!raw) {
    cachedUser = null;
    return null;
  }

  try {
    cachedUser = JSON.parse(raw) as User;
  } catch {
    cachedUser = null;
  }
  return cachedUser;
}

function invalidateUserCache() {
  cachedUserRaw = undefined;
}

function subscribeSessionUser(callback: () => void) {
  const onAuthChange = () => {
    invalidateUserCache();
    callback();
  };

  window.addEventListener("paykop_auth_change", onAuthChange);
  return () => window.removeEventListener("paykop_auth_change", onAuthChange);
}

export function useSessionUser(): User | null {
  return useSyncExternalStore(
    subscribeSessionUser,
    getUserSnapshot,
    () => null
  );
}

export function useIsAuthenticated(): boolean {
  return useSyncExternalStore(
    subscribeSessionUser,
    () => session.isAuthenticated(),
    () => false
  );
}
