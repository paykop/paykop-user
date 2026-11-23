import { User, TokenPair } from "@/types";

const ACCESS_TOKEN_KEY = "paykop_access_token";
const REFRESH_TOKEN_KEY = "paykop_refresh_token";
const USER_KEY = "paykop_user";

const SESSION_COOKIE = "paykop_session=1";
const SESSION_COOKIE_CLEAR = "paykop_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";

function setSessionCookie() {
  document.cookie = `${SESSION_COOKIE}; path=/; SameSite=Lax`;
}

function clearSessionCookie() {
  document.cookie = SESSION_COOKIE_CLEAR;
}

function expireLegacyCookie() {
  document.cookie = "paykop_access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
}

export const session = {
  getAccessToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  },

  getRefreshToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  },

  getUser(): User | null {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  setSession(tokens: TokenPair, user?: User) {
    if (typeof window === "undefined") return;
    localStorage.setItem(ACCESS_TOKEN_KEY, tokens.access_token);
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh_token);
    expireLegacyCookie();
    setSessionCookie();

    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    }
    window.dispatchEvent(new Event("paykop_auth_change"));
  },

  setUser(user: User) {
    if (typeof window === "undefined") return;
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    window.dispatchEvent(new Event("paykop_auth_change"));
  },

  clearSession() {
    if (typeof window === "undefined") return;
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    expireLegacyCookie();
    clearSessionCookie();
    window.dispatchEvent(new Event("paykop_auth_change"));
  },

  isAuthenticated(): boolean {
    return Boolean(this.getAccessToken());
  },
};
