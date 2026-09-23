import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth/get-admin";
import { isStaffOrAbove } from "@/lib/permissions";
import { ContentForm } from "@/components/admin/ContentForm";
import { createContentItem } from "../actions";

export default async function NewContentPage() {
  const session = await getAdminSession();
  // Moderator has read-only "content review" access (SPEC §21) — creating
  // content requires staff+, matching the server action's own check.
  if (!isStaffOrAbove(session?.admin ?? null)) redirect("/admin/content");

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold">New content</h1>
      <ContentForm action={createContentItem} submitLabel="Create" />
    </div>
  );
}
