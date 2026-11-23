const INTERNAL_PATH_RE = /^\/[a-zA-Z0-9/_\-.?=&%]*$/;

/** Validate a post-login redirect path is same-origin and free of open-redirect tricks. */
export function isSafeInternalRedirect(path: string, origin?: string): boolean {
  if (!path || !path.startsWith("/")) return false;
  if (path.startsWith("//")) return false;
  if (path.includes("\\") || path.includes("@")) return false;

  const lower = path.toLowerCase();
  if (lower.includes("%5c") || lower.includes("%2f%2f")) return false;

  if (!INTERNAL_PATH_RE.test(path)) return false;

  if (typeof window !== "undefined" || origin) {
    const base = origin ?? (typeof window !== "undefined" ? window.location.origin : "http://localhost");
    try {
      const url = new URL(path, base);
      if (url.origin !== base) return false;
      if (url.pathname !== path.split("?")[0].split("#")[0]) {
        // Reject paths that normalize differently (e.g. /\evil.com)
        const pathOnly = path.split("?")[0].split("#")[0];
        if (url.pathname !== pathOnly) return false;
      }
    } catch {
      return false;
    }
  }

  return true;
}
