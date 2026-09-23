import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Every admin action that creates, modifies, or deletes data — or changes a
 * role/permission — must call this (SPEC §27, §29). audit_log is
 * append-only: the RLS policy grants insert/select only, no update/delete,
 * not even for Super Admin.
 */
export async function writeAuditLog(
  supabase: SupabaseClient,
  entry: {
    actorId: string;
    action: string;
    entityType: string;
    entityId?: string;
    changes?: Record<string, unknown>;
  }
): Promise<void> {
  const { error } = await supabase.from("audit_log").insert({
    actor_id: entry.actorId,
    action: entry.action,
    entity_type: entry.entityType,
    entity_id: entry.entityId ?? null,
    changes: entry.changes ?? null,
  });

  if (error) {
    // Auditing must never silently fail a real user-facing action, but it
    // also must never be allowed to block one — log loudly and move on.
    console.error("audit_log write failed", { entry, error });
  }
}
