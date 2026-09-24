import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser-side Supabase client — auth (sign in, MFA) and Realtime
 * subscriptions only. All application data goes through the backend API
 * (src/lib/api-client.ts), not direct table queries from this app.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
