import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseJsClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

/**
 * Server-side Supabase client for use in Server Components, route handlers,
 * and Server Actions. Still uses the anon key and is still subject to RLS —
 * this is what most server code should use.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Called from a Server Component with no request context to
            // write to — safe to ignore when middleware refreshes sessions.
          }
        },
      },
    }
  );
}

/**
 * Service-role client that bypasses RLS entirely. Server-only, never import
 * from client code. Reserve for the few operations RLS genuinely can't
 * express (e.g. minting a signed storage URL after an app-level permission
 * check, or a scheduled retention job) — everything else should go through
 * createClient() above so RLS stays the enforced floor (SPEC §27).
 */
export function createServiceRoleClient() {
  return createSupabaseJsClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
