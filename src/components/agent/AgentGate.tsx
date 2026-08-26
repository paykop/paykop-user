"use client";

import { ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Briefcase, Loader2 } from "lucide-react";
import { session } from "@/lib/auth/session";
import { isAgentUser } from "@/lib/auth/postLogin";
import { api } from "@/lib/api/endpoints";
import { User } from "@/types";

export function AgentGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    let cancelled = false;

    const sync = async () => {
      if (!session.isAuthenticated()) {
        if (!cancelled) {
          setUser(null);
          setReady(true);
        }
        return;
      }

      let current = session.getUser();
      if (!current) {
        if (!cancelled) setReady(false);
        try {
          current = await api.auth.getMe();
          session.setUser(current);
        } catch {
          current = null;
        }
      }

      if (!cancelled) {
        setUser(current);
        setReady(true);
      }
    };

    sync();
    window.addEventListener("paykop_auth_change", sync);
    return () => {
      cancelled = true;
      window.removeEventListener("paykop_auth_change", sync);
    };
  }, []);

  if (!ready) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 text-[var(--primary)] animate-spin" />
        <p className="text-xs text-gray-500 mt-2">Checking agent access...</p>
      </div>
    );
  }

  if (!session.isAuthenticated()) {
    const redirect = encodeURIComponent(pathname || "/agent");
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-[var(--primary-subtle)] text-[var(--primary)] flex items-center justify-center mx-auto">
          <Briefcase className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-gray-900 tracking-tight">Agent sign in required</h2>
        <p className="text-sm text-gray-500">
          Sign in with your agent phone or registered email to manage sellers in the field.
        </p>
        <Link
          href={`/login?mode=agent&redirect=${redirect}`}
          className="inline-flex px-6 py-3 rounded-full shopcart-btn-primary font-bold text-xs shadow-md"
        >
          Sign in as agent
        </Link>
      </div>
    );
  }

  if (!user || !isAgentUser(user)) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-gray-100 text-gray-400 flex items-center justify-center mx-auto">
          <Briefcase className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-gray-900 tracking-tight">Agent access required</h2>
        <p className="text-sm text-gray-500">
          This portal is only for accounts approved as field agents by an admin.
        </p>
        <Link href="/" className="inline-flex px-6 py-3 rounded-full shopcart-btn-primary font-bold text-xs">
          Back to shop
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
