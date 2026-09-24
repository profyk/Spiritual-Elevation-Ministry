import { createClient } from "@/lib/supabase/server";
import type { AdminProfile, AdminRole } from "@sem/shared";
import type { AuthenticatorAssuranceLevels } from "@supabase/supabase-js";

export interface AdminSession {
  admin: AdminProfile;
  mfaCurrentLevel: AuthenticatorAssuranceLevels | null;
  mfaNextLevel: AuthenticatorAssuranceLevels | null;
  /** For Server Components calling the backend API directly. */
  accessToken: string;
}

/**
 * Resolves the current request's admin identity, if any. Returns null for
 * an unauthenticated visitor, a signed-in user with no admin_users row, or
 * a deactivated one. Reads admin_users directly (RLS's "admin reads own
 * profile" policy is what actually permits this) rather than round-
 * tripping through the backend — this is session/identity resolution,
 * colocated with the auth flow like the rest of Supabase Auth, not the
 * "business data" the backend owns.
 */
export async function getAdminSession(): Promise<AdminSession | null> {
  const supabase = await createClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return null;

  const { data: adminRow } = await supabase
    .from("admin_users")
    .select("id, role, is_active")
    .eq("id", session.user.id)
    .maybeSingle();

  if (!adminRow || !adminRow.is_active) return null;

  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

  return {
    admin: {
      id: adminRow.id,
      role: adminRow.role as AdminRole,
      isActive: adminRow.is_active,
    },
    mfaCurrentLevel: aal?.currentLevel ?? null,
    mfaNextLevel: aal?.nextLevel ?? null,
    accessToken: session.access_token,
  };
}
