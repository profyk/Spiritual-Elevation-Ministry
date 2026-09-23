"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getAdminSession } from "@/lib/auth/get-admin";
import { isStaffOrAbove } from "@/lib/permissions";
import { writeAuditLog } from "@/lib/audit";

async function requireStaff() {
  const session = await getAdminSession();
  if (!isStaffOrAbove(session?.admin ?? null)) throw new Error("Not authorized.");
  return session!;
}

export async function moderateTestimony(
  id: string,
  decision: "approved" | "rejected",
  internalReason?: string
) {
  const session = await requireStaff();
  const supabase = await createClient();

  const { error } = await supabase
    .from("testimonies")
    .update({
      status: decision,
      internal_reason: decision === "rejected" ? internalReason ?? null : null,
      moderated_by: session.admin.id,
      moderated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) throw new Error(error.message);

  await writeAuditLog(supabase, {
    actorId: session.admin.id,
    action: `testimony.${decision}`,
    entityType: "testimonies",
    entityId: id,
  });

  revalidatePath("/admin/testimonies");
}

export async function toggleTestimonyFeatured(id: string, featured: boolean) {
  const session = await requireStaff();
  const supabase = await createClient();

  const { error } = await supabase
    .from("testimonies")
    .update({ is_featured: featured })
    .eq("id", id);

  if (error) throw new Error(error.message);

  await writeAuditLog(supabase, {
    actorId: session.admin.id,
    action: "testimony.feature_toggle",
    entityType: "testimonies",
    entityId: id,
    changes: { is_featured: featured },
  });

  revalidatePath("/admin/testimonies");
}

export async function archiveTestimony(id: string) {
  const session = await requireStaff();
  const supabase = await createClient();

  const { error } = await supabase.from("testimonies").update({ status: "archived" }).eq("id", id);
  if (error) throw new Error(error.message);

  await writeAuditLog(supabase, {
    actorId: session.admin.id,
    action: "testimony.archive",
    entityType: "testimonies",
    entityId: id,
  });

  revalidatePath("/admin/testimonies");
}
