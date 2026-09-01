import { session } from "@/lib/auth/session";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

function generateUUID(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export interface RequestOptions extends RequestInit {
  idempotencyKey?: string;
  skipAuth?: boolean;
  params?: Record<string, string | number | boolean | undefined | null>;
  signal?: AbortSignal;
}

let isRefreshing = false;
let refreshSubscribers: Array<(token: string | null, error?: Error) => void> = [];

function subscribeTokenRefresh(cb: (token: string | null, error?: Error) => void) {
  refreshSubscribers.push(cb);
}

function notifyRefresh(token: string | null, error?: Error) {
  refreshSubscribers.forEach((cb) => cb(token, error));
  refreshSubscribers = [];
}

async function parseJsonSafe(response: Response) {
  return response.json().catch(() => ({}));
}

async function errorMessageFromResponse(response: Response): Promise<string> {
  const fallback = `Request failed (${response.status})`;
  const text = await response.text().catch(() => "");
  if (!text) return fallback;
  try {
    const errorData = JSON.parse(text) as { error?: string; message?: string };
    return errorData.error || errorData.message || fallback;
  } catch {
    return text;
  }
}

export async function apiClient<T = unknown>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { idempotencyKey, skipAuth, params, signal, ...fetchOptions } = options;

  let url = `${API_BASE_URL}/api/v1${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += (url.includes("?") ? "&" : "?") + queryString;
    }
  }

  const headers = new Headers(fetchOptions.headers || {});

  if (!headers.has("Content-Type") && !(fetchOptions.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const method = (fetchOptions.method || "GET").toUpperCase();
  if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
    headers.set("Idempotency-Key", idempotencyKey || generateUUID());
  }

  if (!skipAuth) {
    const token = session.getAccessToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  const response = await fetch(url, {
    ...fetchOptions,
    headers,
    signal,
  });

  if (response.status === 401 && !skipAuth && endpoint !== "/auth/refresh" && endpoint !== "/auth/otp/verify") {
    const refreshToken = session.getRefreshToken();
    if (refreshToken) {
      return new Promise<T>((resolve, reject) => {
        subscribeTokenRefresh(async (newToken, error) => {
          if (error || !newToken) {
            reject(error || new Error("Session expired. Please log in again."));
            return;
          }
          headers.set("Authorization", `Bearer ${newToken}`);
          try {
            const retryRes = await fetch(url, { ...fetchOptions, headers, signal });
            if (!retryRes.ok) {
              const msg = await errorMessageFromResponse(retryRes);
              reject(new ApiError(msg, retryRes.status));
              return;
            }
            if (retryRes.status === 204) {
              resolve({} as T);
              return;
            }
            resolve((await parseJsonSafe(retryRes)) as T);
          } catch (retryErr) {
            reject(retryErr);
          }
        });

        if (!isRefreshing) {
          isRefreshing = true;
          fetch(`${API_BASE_URL}/api/v1/auth/refresh`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refresh_token: refreshToken }),
          })
            .then(async (refreshRes) => {
              if (!refreshRes.ok) {
                session.clearSession();
                throw new Error("Session expired. Please log in again.");
              }
              const pair = await refreshRes.json();
              session.setSession(pair);
              notifyRefresh(pair.access_token);
            })
            .catch((err) => {
              session.clearSession();
              notifyRefresh(null, err instanceof Error ? err : new Error("Session expired. Please log in again."));
            })
            .finally(() => {
              isRefreshing = false;
            });
        }
      });
    }
  }

  if (!response.ok) {
    const message = await errorMessageFromResponse(response);
    throw new ApiError(message, response.status);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return (await parseJsonSafe(response)) as T;
}
