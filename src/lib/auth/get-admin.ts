import { createClient } from "@/lib/supabase/server";
import type { AdminProfile, AdminRole } from "@/lib/permissions";
import type { AuthenticatorAssuranceLevels } from "@supabase/supabase-js";

export interface AdminSession {
  admin: AdminProfile;
  mfaCurrentLevel: AuthenticatorAssuranceLevels | null;
  mfaNextLevel: AuthenticatorAssuranceLevels | null;
}

/**
 * Resolves the current request's admin identity, if any. Returns null for
 * an unauthenticated visitor, a signed-in user with no admin_users row
 * (e.g. a visitor's anonymous session), or an admin_users row that's been
 * deactivated.
 */
export async function getAdminSession(): Promise<AdminSession | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: adminRow } = await supabase
    .from("admin_users")
    .select("id, role, is_active")
    .eq("id", user.id)
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
  };
}
