import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { Capacitor } from "@capacitor/core";

// When running as a native iOS/Android app the frontend bundle loads from
// capacitor://localhost, so relative /api/* paths resolve nowhere. Point
// every request at the real production origin instead.
const API_BASE = Capacitor.isNativePlatform() ? "https://shvi.app" : "";

function toAbsoluteUrl(url: string): string {
  return url.startsWith("/") ? `${API_BASE}${url}` : url;
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

// CSRF token cache — fetched lazily before the first mutating request.
let cachedCsrfToken: string | null = null;
let csrfFetchPromise: Promise<string> | null = null;

async function getCsrfToken(): Promise<string> {
  if (cachedCsrfToken) return cachedCsrfToken;
  if (!csrfFetchPromise) {
    csrfFetchPromise = fetch(toAbsoluteUrl("/api/csrf-token"), { credentials: "include" })
      .then((r) => r.json())
      .then((data: { token: string }) => {
        cachedCsrfToken = data.token;
        csrfFetchPromise = null;
        return cachedCsrfToken!;
      })
      .catch(() => {
        csrfFetchPromise = null;
        return "";
      });
  }
  return csrfFetchPromise;
}

/** Call after logout so the next mutation re-fetches a fresh token. */
export function clearCsrfToken() {
  cachedCsrfToken = null;
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const headers: Record<string, string> = data ? { "Content-Type": "application/json" } : {};

  if (!["GET", "HEAD", "OPTIONS"].includes(method.toUpperCase())) {
    const token = await getCsrfToken();
    if (token) headers["X-CSRF-Token"] = token;
  }

  const res = await fetch(toAbsoluteUrl(url), {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(toAbsoluteUrl(queryKey.join("/") as string), {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: true,
      staleTime: 10_000,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
