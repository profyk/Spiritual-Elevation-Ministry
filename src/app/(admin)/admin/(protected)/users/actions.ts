"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getAdminSession } from "@/lib/auth/get-admin";
import { canManageAdminUsers, type AdminRole } from "@/lib/permissions";
import { writeAuditLog } from "@/lib/audit";

async function requireSuperAdmin() {
  const session = await getAdminSession();
  if (!canManageAdminUsers(session?.admin ?? null)) throw new Error("Not authorized.");
  return session!;
}

export async function setAdminRole(userId: string, role: AdminRole) {
  const session = await requireSuperAdmin();
  const supabase = await createClient();

  const { error } = await supabase.from("admin_users").update({ role }).eq("id", userId);
  if (error) throw new Error(error.message);

  await writeAuditLog(supabase, {
    actorId: session.admin.id,
    action: "admin_user.role_change",
    entityType: "admin_users",
    entityId: userId,
    changes: { role },
  });

  revalidatePath("/admin/users");
}

export async function setAdminActive(userId: string, isActive: boolean) {
  const session = await requireSuperAdmin();
  const supabase = await createClient();

  const { error } = await supabase.from("admin_users").update({ is_active: isActive }).eq("id", userId);
  if (error) throw new Error(error.message);

  await writeAuditLog(supabase, {
    actorId: session.admin.id,
    action: "admin_user.active_change",
    entityType: "admin_users",
    entityId: userId,
    changes: { is_active: isActive },
  });

  revalidatePath("/admin/users");
}
