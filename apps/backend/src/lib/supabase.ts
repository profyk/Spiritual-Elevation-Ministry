import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * A client scoped to one caller's own Supabase access token — RLS
 * evaluates auth.uid() from this token exactly as it would for a direct
 * browser request, so every policy in supabase/migrations keeps enforcing
 * itself here. This is the client every route should use unless it has a
 * specific, commented reason to reach for the service-role client instead.
 */
export function createUserScopedClient(accessToken: string): SupabaseClient {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/**
 * Anon-key client with no user token — for genuinely public reads where
 * RLS allows `using (true)` or an unauthenticated-safe subquery (published
 * content, approved testimonies, public settings/legal pages).
 */
export function createAnonClient(): SupabaseClient {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/**
 * Bypasses RLS entirely. Reserve for what RLS genuinely can't express or
 * where the caller is deliberately unprivileged (a public submission
 * fanning a notification out to every admin; storage operations, since
 * storage.objects RLS is deliberately deny-all — see
 * supabase/migrations/0002_storage_and_media_policies.sql) or system jobs
 * (cron) with no human caller at all. Never use this just to avoid writing
 * the right RLS-respecting query.
 */
export function createServiceRoleClient(): SupabaseClient {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
