"use server";

import { revalidatePath } from "next/cache";
import { getAdminSession } from "@/lib/auth/get-admin";
import { adminApiFetchServer } from "@/lib/api-client";
import { canManageAdminUsers, type AdminRole } from "@sem/shared";

async function requireSuperAdminSession() {
  const session = await getAdminSession();
  if (!canManageAdminUsers(session?.admin ?? null)) throw new Error("Not authorized.");
  return session!;
}

export async function createAdminUser(input: { email: string; fullName: string; role: AdminRole }) {
  const session = await requireSuperAdminSession();
  const result = await adminApiFetchServer<{ id: string; email: string; tempPassword: string }>(
    "/admin/users",
    session.accessToken,
    { method: "POST", body: JSON.stringify(input) }
  );
  revalidatePath("/admin/users");
  return result;
}

export async function setAdminRole(userId: string, role: AdminRole) {
  const session = await requireSuperAdminSession();
  await adminApiFetchServer(`/admin/users/${userId}/role`, session.accessToken, {
    method: "PATCH",
    body: JSON.stringify({ role }),
  });
  revalidatePath("/admin/users");
}

export async function setAdminActive(userId: string, isActive: boolean) {
  const session = await requireSuperAdminSession();
  await adminApiFetchServer(`/admin/users/${userId}/active`, session.accessToken, {
    method: "PATCH",
    body: JSON.stringify({ isActive }),
  });
  revalidatePath("/admin/users");
}
