"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAdminSession } from "@/lib/auth/get-admin";
import { isStaffOrAbove } from "@/lib/permissions";
import { writeAuditLog } from "@/lib/audit";
import { contentItemSchema, contentStatusSchema } from "@/lib/validation/content-item";

function parseFormPayload(formData: FormData) {
  const scheduledForRaw = formData.get("scheduledFor");
  return {
    contentType: formData.get("contentType"),
    title: formData.get("title"),
    slug: formData.get("slug"),
    summary: formData.get("summary") || undefined,
    body: formData.get("body") || undefined,
    category: formData.get("category") || undefined,
    tags: String(formData.get("tags") ?? "")
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean),
    status: formData.get("status"),
    // datetime-local inputs have no timezone offset; interpret in server
    // local time and normalize to a full ISO 8601 string.
    scheduledFor: scheduledForRaw ? new Date(String(scheduledForRaw)).toISOString() : null,
    coverMediaId: formData.get("coverMediaId") || null,
    mediaId: formData.get("mediaId") || null,
  };
}

export async function createContentItem(formData: FormData) {
  const session = await getAdminSession();
  if (!isStaffOrAbove(session?.admin ?? null)) throw new Error("Not authorized.");

  const parsed = contentItemSchema.parse(parseFormPayload(formData));
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("content_items")
    .insert({
      content_type: parsed.contentType,
      title: parsed.title,
      slug: parsed.slug,
      summary: parsed.summary ?? null,
      body: parsed.body ?? null,
      category: parsed.category ?? null,
      tags: parsed.tags,
      status: parsed.status,
      published_at: parsed.status === "published" ? new Date().toISOString() : null,
      scheduled_for: parsed.scheduledFor,
      author_id: session!.admin.id,
      cover_media_id: parsed.coverMediaId,
      media_id: parsed.mediaId,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  await writeAuditLog(supabase, {
    actorId: session!.admin.id,
    action: "content.create",
    entityType: "content_items",
    entityId: data.id,
    changes: { title: parsed.title, status: parsed.status },
  });

  revalidatePath("/admin/content");
  redirect("/admin/content");
}

export async function updateContentItem(id: string, formData: FormData) {
  const session = await getAdminSession();
  if (!isStaffOrAbove(session?.admin ?? null)) throw new Error("Not authorized.");

  const parsed = contentItemSchema.parse(parseFormPayload(formData));
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("content_items")
    .select("status")
    .eq("id", id)
    .maybeSingle();

  const becomingPublished = parsed.status === "published" && existing?.status !== "published";

  const { error } = await supabase
    .from("content_items")
    .update({
      content_type: parsed.contentType,
      title: parsed.title,
      slug: parsed.slug,
      summary: parsed.summary ?? null,
      body: parsed.body ?? null,
      category: parsed.category ?? null,
      tags: parsed.tags,
      status: parsed.status,
      published_at: becomingPublished ? new Date().toISOString() : undefined,
      scheduled_for: parsed.scheduledFor,
      cover_media_id: parsed.coverMediaId,
      media_id: parsed.mediaId,
    })
    .eq("id", id);

  if (error) throw new Error(error.message);

  await writeAuditLog(supabase, {
    actorId: session!.admin.id,
    action: "content.update",
    entityType: "content_items",
    entityId: id,
    changes: { title: parsed.title, status: parsed.status },
  });

  revalidatePath("/admin/content");
  redirect("/admin/content");
}

export async function setContentStatus(id: string, status: unknown) {
  const session = await getAdminSession();
  if (!isStaffOrAbove(session?.admin ?? null)) throw new Error("Not authorized.");

  const parsedStatus = contentStatusSchema.parse(status);
  const supabase = await createClient();

  const { error } = await supabase
    .from("content_items")
    .update({
      status: parsedStatus,
      published_at: parsedStatus === "published" ? new Date().toISOString() : undefined,
    })
    .eq("id", id);

  if (error) throw new Error(error.message);

  await writeAuditLog(supabase, {
    actorId: session!.admin.id,
    action: "content.status_change",
    entityType: "content_items",
    entityId: id,
    changes: { status: parsedStatus },
  });

  revalidatePath("/admin/content");
}
