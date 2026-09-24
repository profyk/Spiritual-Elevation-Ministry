import { apiFetchSafe } from "@/lib/api-client";

/**
 * Reads one key from website_settings via the backend's public settings
 * endpoint (SPEC §20a). Falls back to `fallback` if the row is missing or
 * the backend is unreachable, so pages never hard-crash on a missing
 * setting or a down backend.
 */
export async function getSetting<T = string>(key: string, fallback: T): Promise<T> {
  const result = await apiFetchSafe<Record<string, T>>(`/settings?keys=${encodeURIComponent(key)}`, {});
  return key in result ? result[key] : fallback;
}

export async function getWhatsAppNumber(): Promise<string> {
  // Dev/local fallback only — production should always configure this via
  // Admin -> Settings -> Communication -> WhatsApp instead (SPEC §18).
  return getSetting("whatsapp_number", process.env.WHATSAPP_FALLBACK_NUMBER ?? "");
}
