import { createClient } from "@/lib/supabase/server";

/**
 * Reads one key from website_settings (SPEC §20a). Values are stored as
 * jsonb, so a plain string setting is stored JSON-encoded (e.g. '"..."') —
 * this unwraps that. Falls back to `fallback` if the row is missing or the
 * query fails (e.g. no Supabase project configured yet in this
 * environment), so pages never hard-crash on a missing setting.
 */
export async function getSetting<T = string>(key: string, fallback: T): Promise<T> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("website_settings")
      .select("value")
      .eq("key", key)
      .maybeSingle();

    if (error || !data) return fallback;
    return data.value as T;
  } catch {
    return fallback;
  }
}

export async function getWhatsAppNumber(): Promise<string> {
  // Dev/local fallback only — production should always configure this via
  // Admin -> Settings -> Communication -> WhatsApp instead (SPEC §18).
  return getSetting("whatsapp_number", process.env.WHATSAPP_FALLBACK_NUMBER ?? "");
}
