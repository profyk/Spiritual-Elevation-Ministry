import { getAdminSession } from "@/lib/auth/get-admin";
import { createClient } from "@/lib/supabase/server";
import { NotificationPreferenceToggle } from "@/components/admin/NotificationPreferenceToggle";
import type { NotificationCategory } from "@/lib/notifications";

const CATEGORIES: { value: NotificationCategory; label: string }[] = [
  { value: "new_request", label: "New ministry request" },
  { value: "new_conversation", label: "New chat conversation" },
  { value: "new_testimony", label: "New testimony to review" },
];

export default async function NotificationPreferencesPage() {
  const session = await getAdminSession();
  const supabase = await createClient();

  const { data: preferences } = await supabase
    .from("notification_preferences")
    .select("category, email_enabled")
    .eq("admin_id", session!.admin.id);

  const enabledByCategory = new Map(
    (preferences ?? []).map((p) => [p.category, p.email_enabled])
  );

  return (
    <div className="max-w-md">
      <h1 className="mb-2 text-xl font-semibold">Notification Preferences</h1>
      <p className="mb-6 text-sm text-neutral-500">
        In-app notifications for items assigned to you are always on. This controls whether you
        also get an email for each category.
      </p>
      <div className="space-y-2">
        {CATEGORIES.map((c) => (
          <NotificationPreferenceToggle
            key={c.value}
            category={c.value}
            label={c.label}
            initialEnabled={enabledByCategory.get(c.value) ?? true}
          />
        ))}
      </div>
    </div>
  );
}
