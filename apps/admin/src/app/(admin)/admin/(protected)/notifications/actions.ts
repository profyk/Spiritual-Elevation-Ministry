"use server";

import { revalidatePath } from "next/cache";
import { getAdminSession } from "@/lib/auth/get-admin";
import { adminApiFetchServer } from "@/lib/api-client";
import type { NotificationCategory } from "@sem/shared";

export async function markNotificationRead(id: string) {
  const session = await getAdminSession();
  if (!session) throw new Error("Not authorized.");

  await adminApiFetchServer(`/admin/notifications/${id}/read`, session.accessToken, { method: "PATCH" });
  revalidatePath("/admin", "layout");
}

export async function markAllNotificationsRead() {
  const session = await getAdminSession();
  if (!session) throw new Error("Not authorized.");

  await adminApiFetchServer("/admin/notifications/read-all", session.accessToken, { method: "PATCH" });
  revalidatePath("/admin", "layout");
}

export async function updateNotificationPreference(
  category: NotificationCategory,
  emailEnabled: boolean
) {
  const session = await getAdminSession();
  if (!session) throw new Error("Not authorized.");

  await adminApiFetchServer(`/admin/notification-preferences/${category}`, session.accessToken, {
    method: "PUT",
    body: JSON.stringify({ emailEnabled }),
  });
  revalidatePath("/admin/notifications/preferences");
}
