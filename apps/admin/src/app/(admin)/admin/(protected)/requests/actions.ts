"use server";

import { revalidatePath } from "next/cache";
import { getAdminSession } from "@/lib/auth/get-admin";
import { adminApiFetchServer } from "@/lib/api-client";
import { isStaffOrAbove, isAdminOrAbove } from "@sem/shared";

async function requireStaffSession() {
  const session = await getAdminSession();
  if (!isStaffOrAbove(session?.admin ?? null)) throw new Error("Not authorized.");
  return session!;
}

async function requireAdminSession() {
  const session = await getAdminSession();
  if (!isAdminOrAbove(session?.admin ?? null)) throw new Error("Not authorized.");
  return session!;
}

export async function claimRequest(id: string) {
  const session = await requireStaffSession();
  await adminApiFetchServer(`/admin/requests/${id}/claim`, session.accessToken, { method: "PATCH" });
  revalidatePath("/admin/requests");
}

export async function setRequestStatus(id: string, status: "in_progress" | "resolved" | "archived") {
  const session = await requireStaffSession();
  await adminApiFetchServer(`/admin/requests/${id}/status`, session.accessToken, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
  revalidatePath("/admin/requests");
}

/** SPEC §28: permanent, admin+ only, and only ever on an already-archived request. */
export async function deleteRequest(id: string) {
  const session = await requireAdminSession();
  await adminApiFetchServer(`/admin/requests/${id}`, session.accessToken, { method: "DELETE" });
  revalidatePath("/admin/requests");
}
