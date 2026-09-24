import { createClient } from "@supabase/supabase-js";
// Relative import, not the "@/*" alias — not confident Playwright's test
// runner resolves tsconfig path aliases the same way Next.js/Vitest do,
// and this is the only type this file needs from src/.
import type { AdminRole } from "../../../src/lib/permissions";

/**
 * Creates a throwaway admin_users account for one test run, via the
 * Supabase Auth admin API — the same one-time "create the first Super
 * Admin" step docs/DEPLOYMENT.md walks a human through, just scripted.
 * Requires E2E_SUPABASE_SERVICE_ROLE_KEY (a real project's service role
 * key) — tests using this should skip themselves when it's absent rather
 * than fail, since it's genuinely optional infrastructure.
 */
export async function provisionTestAdmin(role: AdminRole) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.E2E_SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL and E2E_SUPABASE_SERVICE_ROLE_KEY must both be set to provision a test admin."
    );
  }

  const supabase = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const email = `e2e-${role}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.test`;
  const password = `E2e-${Math.random().toString(36).slice(2, 10)}-Aa1!`;

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error || !data.user) {
    throw new Error(`Failed to create test auth user: ${error?.message}`);
  }

  const { error: insertError } = await supabase
    .from("admin_users")
    .insert({ id: data.user.id, full_name: `E2E Test ${role}`, role });
  if (insertError) {
    await supabase.auth.admin.deleteUser(data.user.id);
    throw new Error(`Failed to create admin_users row: ${insertError.message}`);
  }

  return {
    id: data.user.id,
    email,
    password,
    async cleanup() {
      // admin_users.id -> auth.users.id is "on delete cascade" (0001_init.sql),
      // so deleting the auth user is enough to clean up both rows.
      await supabase.auth.admin.deleteUser(data.user.id);
    },
  };
}
