"use server";

import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth/get-admin";
import { adminApiFetchServer } from "@/lib/api-client";
import { isStaffOrAbove, eventSchema } from "@sem/shared";

function parseForm(formData: FormData) {
  return {
    title: formData.get("title"),
    slug: formData.get("slug"),
    description: formData.get("description") || undefined,
    startAt: formData.get("startAt")
      ? new Date(String(formData.get("startAt"))).toISOString()
      : "",
    endAt: formData.get("endAt")
      ? new Date(String(formData.get("endAt"))).toISOString()
      : undefined,
    locationType: formData.get("locationType"),
    locationAddress: formData.get("locationAddress") || undefined,
    onlineUrl: formData.get("onlineUrl") || "",
    status: formData.get("status"),
    rsvpEnabled: formData.get("rsvpEnabled") === "on",
    capacity: formData.get("capacity") || undefined,
    coverMediaId: formData.get("coverMediaId") || null,
    coverMediaAltText: formData.get("coverMediaAltText") || undefined,
  };
}

async function requireStaffSession() {
  const session = await getAdminSession();
  if (!isStaffOrAbove(session?.admin ?? null)) throw new Error("Not authorized.");
  return session!;
}

export async function createEvent(formData: FormData) {
  const session = await requireStaffSession();
  const parsed = eventSchema.parse(parseForm(formData));

  await adminApiFetchServer("/admin/events", session.accessToken, {
    method: "POST",
    body: JSON.stringify(parsed),
  });

  redirect("/admin/events");
}

export async function updateEvent(id: string, formData: FormData) {
  const session = await requireStaffSession();
  const parsed = eventSchema.parse(parseForm(formData));

  await adminApiFetchServer(`/admin/events/${id}`, session.accessToken, {
    method: "PATCH",
    body: JSON.stringify(parsed),
  });

  redirect("/admin/events");
}
