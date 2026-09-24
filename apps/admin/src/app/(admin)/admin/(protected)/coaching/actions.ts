"use server";

import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth/get-admin";
import { adminApiFetchServer } from "@/lib/api-client";
import { isStaffOrAbove, coachingProgramSchema } from "@sem/shared";

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

async function requireStaffSession() {
  const session = await getAdminSession();
  if (!isStaffOrAbove(session?.admin ?? null)) throw new Error("Not authorized.");
  return session!;
}

export async function createCoachingProgram(formData: FormData) {
  const session = await requireStaffSession();
  const parsed = coachingProgramSchema.parse(parseForm(formData));

  await adminApiFetchServer("/admin/coaching-programs", session.accessToken, {
    method: "POST",
    body: JSON.stringify(parsed),
  });

  redirect("/admin/coaching");
}

export async function updateCoachingProgram(id: string, formData: FormData) {
  const session = await requireStaffSession();
  const parsed = coachingProgramSchema.parse(parseForm(formData));

  await adminApiFetchServer(`/admin/coaching-programs/${id}`, session.accessToken, {
    method: "PATCH",
    body: JSON.stringify(parsed),
  });

  redirect("/admin/coaching");
}
