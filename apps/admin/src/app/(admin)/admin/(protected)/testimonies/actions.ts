"use server";

import { revalidatePath } from "next/cache";
import { getAdminSession } from "@/lib/auth/get-admin";
import { adminApiFetchServer } from "@/lib/api-client";
import { isModeratorOrAbove } from "@sem/shared";

// Testimony moderation is Moderator's core job (SPEC §21) — gate on
// moderator+, not staff+, so Moderator keeps this ability.
async function requireModeratorSession() {
  const session = await getAdminSession();
  if (!isModeratorOrAbove(session?.admin ?? null)) throw new Error("Not authorized.");
  return session!;
}

export async function moderateTestimony(
  id: string,
  decision: "approved" | "rejected",
  internalReason?: string
) {
  const session = await requireModeratorSession();
  await adminApiFetchServer(`/admin/testimonies/${id}/moderate`, session.accessToken, {
    method: "PATCH",
    body: JSON.stringify({ decision, internalReason }),
  });
  revalidatePath("/admin/testimonies");
}

export async function toggleTestimonyFeatured(id: string, featured: boolean) {
  const session = await requireModeratorSession();
  await adminApiFetchServer(`/admin/testimonies/${id}/feature`, session.accessToken, {
    method: "PATCH",
    body: JSON.stringify({ featured }),
  });
  revalidatePath("/admin/testimonies");
}

export async function archiveTestimony(id: string) {
  const session = await requireModeratorSession();
  await adminApiFetchServer(`/admin/testimonies/${id}/archive`, session.accessToken, {
    method: "PATCH",
  });
  revalidatePath("/admin/testimonies");
}
