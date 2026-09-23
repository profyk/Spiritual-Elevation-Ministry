"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAdminSession } from "@/lib/auth/get-admin";
import { isStaffOrAbove } from "@/lib/permissions";
import { writeAuditLog } from "@/lib/audit";
import { coachingProgramSchema } from "@/lib/validation/coaching-program";

function parseForm(formData: FormData) {
  return {
    title: formData.get("title"),
    slug: formData.get("slug"),
    description: formData.get("description") || undefined,
    format: formData.get("format") || undefined,
    duration: formData.get("duration") || undefined,
    priceAmount: formData.get("priceAmount") || undefined,
    priceCurrency: formData.get("priceCurrency") || "ZAR",
    capacity: formData.get("capacity") || undefined,
    status: formData.get("status"),
  };
}

async function requireStaff() {
  const session = await getAdminSession();
  if (!isStaffOrAbove(session?.admin ?? null)) throw new Error("Not authorized.");
  return session!;
}

export async function createCoachingProgram(formData: FormData) {
  const session = await requireStaff();
  const parsed = coachingProgramSchema.parse(parseForm(formData));
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("coaching_programs")
    .insert({
      title: parsed.title,
      slug: parsed.slug,
      description: parsed.description ?? null,
      format: parsed.format ?? null,
      duration: parsed.duration ?? null,
      price_amount: parsed.priceAmount ?? null,
      price_currency: parsed.priceCurrency,
      capacity: parsed.capacity ?? null,
      status: parsed.status,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  await writeAuditLog(supabase, {
    actorId: session.admin.id,
    action: "coaching_program.create",
    entityType: "coaching_programs",
    entityId: data.id,
  });

  revalidatePath("/admin/coaching");
  redirect("/admin/coaching");
}

export async function updateCoachingProgram(id: string, formData: FormData) {
  const session = await requireStaff();
  const parsed = coachingProgramSchema.parse(parseForm(formData));
  const supabase = await createClient();

  const { error } = await supabase
    .from("coaching_programs")
    .update({
      title: parsed.title,
      slug: parsed.slug,
      description: parsed.description ?? null,
      format: parsed.format ?? null,
      duration: parsed.duration ?? null,
      price_amount: parsed.priceAmount ?? null,
      price_currency: parsed.priceCurrency,
      capacity: parsed.capacity ?? null,
      status: parsed.status,
    })
    .eq("id", id);

  if (error) throw new Error(error.message);

  await writeAuditLog(supabase, {
    actorId: session.admin.id,
    action: "coaching_program.update",
    entityType: "coaching_programs",
    entityId: id,
  });

  revalidatePath("/admin/coaching");
  redirect("/admin/coaching");
}
