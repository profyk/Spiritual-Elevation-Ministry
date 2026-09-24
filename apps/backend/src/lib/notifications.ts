import { createServiceRoleClient } from "./supabase";
import { sendEmail } from "./email-resend";
import { adminNotificationEmail, type NotificationCategory } from "@sem/shared";

export type { NotificationCategory };

/**
 * Fans a notification out to every active admin/staff user: an in-app
 * notifications row always, plus an email for anyone who hasn't opted out
 * of that category (SPEC §19). Called from public routes (a visitor just
 * submitted something), so it runs on the service-role client — those
 * routes have no admin session to act as, and `notifications`/
 * `notification_preferences` intentionally have no RLS policy letting an
 * anonymous visitor write into another user's rows.
 */
export async function notifyAdmins({
  category,
  title,
  body,
  linkPath,
}: {
  category: NotificationCategory;
  title: string;
  body: string;
  linkPath: string;
}): Promise<void> {
  const supabase = createServiceRoleClient();

  const { data: admins } = await supabase
    .from("admin_users")
    .select("id")
    .eq("is_active", true);

  if (!admins || admins.length === 0) return;
  const adminIds: string[] = admins.map((a: { id: string }) => a.id);

  await supabase.from("notifications").insert(
    adminIds.map((id) => ({
      recipient_admin_id: id,
      notification_type: category,
      title,
      body,
      link_url: linkPath,
    }))
  );

  const { data: preferences } = await supabase
    .from("notification_preferences")
    .select("admin_id, email_enabled")
    .eq("category", category)
    .in("admin_id", adminIds);

  const optedOut = new Set(
    (preferences ?? [])
      .filter((p: { email_enabled: boolean }) => !p.email_enabled)
      .map((p: { admin_id: string }) => p.admin_id)
  );

  // admin_users mirrors auth.users but doesn't duplicate the email column —
  // resolve addresses via the auth admin API, which the service-role
  // client is permitted to call.
  const { data: authUsers } = await supabase.auth.admin.listUsers();
  const emailById = new Map((authUsers?.users ?? []).map((u) => [u.id, u.email]));

  const { subject, html } = adminNotificationEmail({ title, body, linkPath });

  await Promise.all(
    adminIds
      .filter((id) => !optedOut.has(id))
      .map((id) => {
        const email = emailById.get(id);
        if (!email) return Promise.resolve();
        return sendEmail({ to: email, subject, html });
      })
  );
}
