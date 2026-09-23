"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAdminSession } from "@/lib/auth/get-admin";
import { isStaffOrAbove } from "@/lib/permissions";
import { writeAuditLog } from "@/lib/audit";
import { eventSchema } from "@/lib/validation/event";

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
  };
}

async function requireStaff() {
  const session = await getAdminSession();
  if (!isStaffOrAbove(session?.admin ?? null)) throw new Error("Not authorized.");
  return session!;
}

export async function createEvent(formData: FormData) {
  const session = await requireStaff();
  const parsed = eventSchema.parse(parseForm(formData));
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("events")
    .insert({
      title: parsed.title,
      slug: parsed.slug,
      description: parsed.description ?? null,
      start_at: parsed.startAt,
      end_at: parsed.endAt ?? null,
      location_type: parsed.locationType,
      location_address: parsed.locationAddress ?? null,
      online_url: parsed.onlineUrl || null,
      status: parsed.status,
      rsvp_enabled: parsed.rsvpEnabled,
      capacity: parsed.capacity ?? null,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  await writeAuditLog(supabase, {
    actorId: session.admin.id,
    action: "event.create",
    entityType: "events",
    entityId: data.id,
  });

  revalidatePath("/admin/events");
  redirect("/admin/events");
}

export async function updateEvent(id: string, formData: FormData) {
  const session = await requireStaff();
  const parsed = eventSchema.parse(parseForm(formData));
  const supabase = await createClient();

  const { error } = await supabase
    .from("events")
    .update({
      title: parsed.title,
      slug: parsed.slug,
      description: parsed.description ?? null,
      start_at: parsed.startAt,
      end_at: parsed.endAt ?? null,
      location_type: parsed.locationType,
      location_address: parsed.locationAddress ?? null,
      online_url: parsed.onlineUrl || null,
      status: parsed.status,
      rsvp_enabled: parsed.rsvpEnabled,
      capacity: parsed.capacity ?? null,
    })
    .eq("id", id);

  if (error) throw new Error(error.message);

  await writeAuditLog(supabase, {
    actorId: session.admin.id,
    action: "event.update",
    entityType: "events",
    entityId: id,
  });

  revalidatePath("/admin/events");
  redirect("/admin/events");
}
