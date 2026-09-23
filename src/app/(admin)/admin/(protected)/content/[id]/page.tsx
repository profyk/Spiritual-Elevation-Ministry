import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ContentForm } from "@/components/admin/ContentForm";
import { updateContentItem } from "../actions";

export default async function EditContentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: item } = await supabase
    .from("content_items")
    .select("content_type, title, slug, summary, body, category, tags, status, scheduled_for")
    .eq("id", id)
    .maybeSingle();

  if (!item) notFound();

  const boundAction = updateContentItem.bind(null, id);

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold">Edit content</h1>
      <ContentForm
        action={boundAction}
        submitLabel="Save changes"
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
        }}
      />
    </div>
  );
}
