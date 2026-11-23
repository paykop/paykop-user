import { User } from "@/types";
import { isSafeInternalRedirect } from "@/lib/auth/safeRedirect";

/** Resolve where to send the user after a successful login. */
export function postLoginPath(user: User, redirect?: string | null): string {
  if (redirect && isSafeInternalRedirect(redirect)) {
    return redirect;
  }
  if (!user.is_onboarded && user.role !== "agent") {
    return "/onboarding";
  }
  if (user.role === "agent") {
    return "/agent";
  }
  return "/";
}

export function isAgentUser(user: User | null | undefined): boolean {
  return user?.role === "agent";
}
