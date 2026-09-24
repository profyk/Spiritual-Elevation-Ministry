"use server";

import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth/get-admin";
import { adminApiFetchServer } from "@/lib/api-client";
import { isStaffOrAbove, contentItemSchema } from "@sem/shared";

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
    coverMediaAltText: formData.get("coverMediaAltText") || undefined,
    mediaId: formData.get("mediaId") || null,
  };
}

export async function createContentItem(formData: FormData) {
  const session = await getAdminSession();
  if (!isStaffOrAbove(session?.admin ?? null)) throw new Error("Not authorized.");

  const parsed = contentItemSchema.parse(parseFormPayload(formData));
  await adminApiFetchServer("/admin/content", session!.accessToken, {
    method: "POST",
    body: JSON.stringify(parsed),
  });

  redirect("/admin/content");
}

export async function updateContentItem(id: string, formData: FormData) {
  const session = await getAdminSession();
  if (!isStaffOrAbove(session?.admin ?? null)) throw new Error("Not authorized.");

  const parsed = contentItemSchema.parse(parseFormPayload(formData));
  await adminApiFetchServer(`/admin/content/${id}`, session!.accessToken, {
    method: "PATCH",
    body: JSON.stringify(parsed),
  });

  redirect("/admin/content");
}
