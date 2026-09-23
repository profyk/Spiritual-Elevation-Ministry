import { createClient } from "@/lib/supabase/client";

const CONVERSATION_ID_KEY = "sem_chat_conversation_id";

/**
 * Ensures the visitor has an anonymous Supabase session before they chat
 * (SPEC §15). Returns the user id, creating the session on first call.
 * Browser-only — must run client-side.
 */
export async function ensureVisitorSession(): Promise<string> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) return user.id;

  const { data, error } = await supabase.auth.signInAnonymously();
  if (error || !data.user) {
    throw new Error("Could not start a chat session.");
  }
  return data.user.id;
}

/**
 * The visitor's own current conversation id, if any — a UX convenience
 * (so returning to the site reopens the same thread) stored per-browser,
 * never used for authorization. Access is still gated entirely by the
 * visitor's anonymous auth session + RLS (SPEC §15), not by this value.
 */
export function getStoredConversationId(): string | null {
  try {
    return localStorage.getItem(CONVERSATION_ID_KEY);
  } catch {
    return null;
  }
}

export function setStoredConversationId(id: string): void {
  try {
    localStorage.setItem(CONVERSATION_ID_KEY, id);
  } catch {
    // Ignore — worst case the visitor starts a fresh conversation next visit.
  }
}
