const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

export async function fetchPublicApi<T>(endpoint: string): Promise<T | null> {
  try {
    const url = `${API_BASE_URL}/api/v1${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}
