import { notFound } from "next/navigation";
import { getAdminSession } from "@/lib/auth/get-admin";
import { adminApiFetchServer } from "@/lib/api-client";
import { isStaffOrAbove } from "@sem/shared";
import { ContentForm } from "@/components/admin/ContentForm";
import { updateContentItem } from "../actions";

interface ContentItemDetail {
  content_type: "prophetic_message" | "sermon" | "article";
  title: string;
  slug: string;
  summary: string | null;
  body: string | null;
  category: string | null;
  tags: string[];
  status: "draft" | "scheduled" | "published" | "unpublished" | "archived";
  scheduled_for: string | null;
  cover_media_id: string | null;
  coverMediaAltText: string | null;
  media_id: string | null;
}

export default async function EditContentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getAdminSession();
  if (!session) notFound();

  // Moderator gets read-only "content review" (SPEC §21) — the form
  // itself locks via readOnly below; the backend re-checks too.
  const readOnly = !isStaffOrAbove(session.admin);

  let item: ContentItemDetail;
  try {
    item = await adminApiFetchServer<ContentItemDetail>(`/admin/content/${id}`, session.accessToken);
  } catch {
    notFound();
  }

  const boundAction = updateContentItem.bind(null, id);

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold">Edit content</h1>
      <ContentForm
        action={boundAction}
        submitLabel="Save changes"
        readOnly={readOnly}
        initialValues={{
          contentType: item.content_type,
          title: item.title,
          slug: item.slug,
          summary: item.summary ?? "",
          body: item.body ?? "",
          category: item.category ?? "",
          tags: (item.tags ?? []).join(", "),
          status: item.status,
          scheduledFor: item.scheduled_for ? item.scheduled_for.slice(0, 16) : "",
          coverMediaId: item.cover_media_id,
          coverMediaAltText: item.coverMediaAltText,
          mediaId: item.media_id,
        }}
      />
    </div>
  );
}
