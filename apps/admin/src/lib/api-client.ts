import { createClient } from "@/lib/supabase/client";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3002";

export async function getAccessToken(): Promise<string | undefined> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token;
}

async function parseErrorMessage(response: Response, path: string): Promise<string> {
  try {
    const body = await response.json();
    if (body?.error) return body.error;
  } catch {
    // Non-JSON error body — fall through to the generic message.
  }
  return `Request to ${path} failed (${response.status}).`;
}

/**
 * Every admin data call goes through here — attaches the signed-in staff
 * member's own Supabase access token, so the backend's requireAdmin()
 * middleware resolves their real role via RLS, never a value this client
 * could fake (SPEC §27's server-side check, now living in the backend
 * instead of a Next.js Server Action).
 */
export async function adminApiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = await getAccessToken();
  const headers = new Headers(init?.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (init?.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");

  const response = await fetch(`${API_URL}${path}`, { ...init, headers, cache: "no-store" });
  if (!response.ok) throw new Error(await parseErrorMessage(response, path));
  if (response.status === 204) return undefined as T;
  return response.json();
}

/**
 * Server Component variant — Next.js Server Components can't read the
 * browser's Supabase session directly, so the access token has to come
 * from the request-scoped server client's cookies instead.
 */
export async function adminApiFetchServer<T>(
  path: string,
  accessToken: string | undefined,
  init?: RequestInit
): Promise<T> {
  const headers = new Headers(init?.headers);
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);
  if (init?.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");

  const response = await fetch(`${API_URL}${path}`, { ...init, headers, cache: "no-store" });
  if (!response.ok) throw new Error(await parseErrorMessage(response, path));
  if (response.status === 204) return undefined as T;
  return response.json();
}
