"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getAdminSession } from "@/lib/auth/get-admin";
import { isAdminOrAbove, canDisableRequiredDisclaimer } from "@/lib/permissions";
import { writeAuditLog } from "@/lib/audit";

async function requireAdmin() {
  const session = await getAdminSession();
  if (!isAdminOrAbove(session?.admin ?? null)) throw new Error("Not authorized.");
  return session!;
}

export async function updateSetting(key: string, value: string) {
  const session = await requireAdmin();
  const supabase = await createClient();

  // `value` is a jsonb column — pass the plain string and let supabase-js
  // serialize it; JSON.stringify()-ing it here would double-encode it.
  const { error } = await supabase
    .from("website_settings")
    .upsert({ key, value, updated_by: session.admin.id, updated_at: new Date().toISOString() });

  if (error) throw new Error(error.message);

  await writeAuditLog(supabase, {
    actorId: session.admin.id,
    action: "settings.update",
    entityType: "website_settings",
    entityId: key,
  });

  revalidatePath("/admin/settings");
}

export async function updateLegalPage(pageType: "privacy_policy" | "terms_of_use", body: string) {
  const session = await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from("legal_pages")
    .upsert(
      { page_type: pageType, body, updated_by: session.admin.id, updated_at: new Date().toISOString() },
      { onConflict: "page_type" }
    );

  if (error) throw new Error(error.message);

  await writeAuditLog(supabase, {
    actorId: session.admin.id,
    action: "legal_page.update",
    entityType: "legal_pages",
    entityId: pageType,
  });

  revalidatePath("/admin/settings");
  revalidatePath(pageType === "privacy_policy" ? "/privacy-policy" : "/terms-of-use");
}

/**
 * Only Super Admin may remove the is_required protection from a disclaimer
 * (SPEC §37). There's no is_required flag in v1's website_settings schema
 * yet — disclaimers are always required — so this exists as the gate point
 * once that flag is added, rather than leaving the rule undocumented in
 * code until then.
 */
export async function assertCanDisableDisclaimer() {
  const session = await getAdminSession();
  if (!canDisableRequiredDisclaimer(session?.admin ?? null)) {
    throw new Error("Only Super Admin can disable a required disclaimer.");
  }
}
