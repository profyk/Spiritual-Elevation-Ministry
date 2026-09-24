export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3002";

/**
 * All application data (content, events, testimonies, settings, requests,
 * chat) lives behind the backend now — this is the one place that builds
 * the URL. Server Components call this directly; client components go
 * through the same function.
 */
export async function apiFetch<T>(
  path: string,
  init?: RequestInit & { accessToken?: string }
): Promise<T> {
  const headers = new Headers(init?.headers);
  if (init?.accessToken) headers.set("Authorization", `Bearer ${init.accessToken}`);
  if (init?.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");

  const response = await fetch(`${API_URL}${path}`, { ...init, headers, cache: "no-store" });

  if (!response.ok) {
    let message = `Request to ${path} failed (${response.status}).`;
    try {
      const body = await response.json();
      if (body?.error) message = body.error;
    } catch {
      // Non-JSON error body — keep the generic message.
    }
    throw new Error(message);
  }

  if (response.status === 204) return undefined as T;
  return response.json();
}

/**
 * Best-effort variant for read paths that should degrade gracefully
 * (public pages rendering with no content yet, or the backend being
 * unreachable) rather than crash the page — mirrors the try/catch
 * fallback pattern every public page used before the split.
 */
export async function apiFetchSafe<T>(path: string, fallback: T, init?: RequestInit): Promise<T> {
  try {
    return await apiFetch<T>(path, init);
  } catch {
    return fallback;
  }
}
