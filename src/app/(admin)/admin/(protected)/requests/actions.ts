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

export async function claimRequest(id: string) {
  const session = await requireStaff();
  const supabase = await createClient();

  const { error } = await supabase
    .from("ministry_requests")
    .update({ assigned_to: session.admin.id, status: "in_progress" })
    .eq("id", id);

  if (error) throw new Error(error.message);

  await writeAuditLog(supabase, {
    actorId: session.admin.id,
    action: "request.claim",
    entityType: "ministry_requests",
    entityId: id,
  });

  revalidatePath("/admin/requests");
}

export async function setRequestStatus(id: string, status: "in_progress" | "resolved" | "archived") {
  const session = await requireStaff();
  const supabase = await createClient();

  const { error } = await supabase.from("ministry_requests").update({ status }).eq("id", id);
  if (error) throw new Error(error.message);

  await writeAuditLog(supabase, {
    actorId: session.admin.id,
    action: "request.status_change",
    entityType: "ministry_requests",
    entityId: id,
    changes: { status },
  });

  revalidatePath("/admin/requests");
}
