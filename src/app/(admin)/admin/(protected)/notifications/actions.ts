"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getAdminSession } from "@/lib/auth/get-admin";
import type { NotificationCategory } from "@/lib/notifications";

export async function markNotificationRead(id: string) {
  const session = await getAdminSession();
  if (!session) throw new Error("Not authorized.");

  const supabase = await createClient();
  await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", id)
    .eq("recipient_admin_id", session.admin.id);

  revalidatePath("/admin", "layout");
}

export async function markAllNotificationsRead() {
  const session = await getAdminSession();
  if (!session) throw new Error("Not authorized.");

  const supabase = await createClient();
  await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("recipient_admin_id", session.admin.id)
    .eq("is_read", false);

  revalidatePath("/admin", "layout");
}

export async function updateNotificationPreference(
  category: NotificationCategory,
  emailEnabled: boolean
) {
  const session = await getAdminSession();
  if (!session) throw new Error("Not authorized.");

  const supabase = await createClient();
  const { error } = await supabase
    .from("notification_preferences")
    .upsert(
      { admin_id: session.admin.id, category, email_enabled: emailEnabled },
      { onConflict: "admin_id,category" }
    );

  if (error) throw new Error(error.message);

  revalidatePath("/admin/notifications/preferences");
}
