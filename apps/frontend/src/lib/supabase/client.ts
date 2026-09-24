import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser-side Supabase client. Uses the anon key — every query through this
 * client is subject to RLS (supabase/migrations/0001_init.sql), never a
 * substitute for a server-side permission check on admin routes.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
