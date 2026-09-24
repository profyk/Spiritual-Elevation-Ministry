"use server";

import { revalidatePath } from "next/cache";
import { getAdminSession } from "@/lib/auth/get-admin";
import { adminApiFetchServer } from "@/lib/api-client";
import { isStaffOrAbove } from "@sem/shared";

async function requireStaffSession() {
  const session = await getAdminSession();
  if (!isStaffOrAbove(session?.admin ?? null)) throw new Error("Not authorized.");
  return session!;
}

export async function sendStaffMessage(
  conversationId: string,
  body: string,
  attachmentMediaId?: string
) {
  const session = await requireStaffSession();
  if (!body.trim() && !attachmentMediaId) return;

  // Shared with the visitor side (src/app/api routes are gone — this is
  // the same backend endpoint ChatWidget's visitor flow posts to; it
  // branches on whether the caller IS the conversation's own visitor).
  await adminApiFetchServer("/messages", session.accessToken, {
    method: "POST",
    body: JSON.stringify({ conversationId, body: body.trim() || undefined, attachmentMediaId }),
  });

  revalidatePath(`/admin/communication/${conversationId}`);
  revalidatePath("/admin/communication");
}

export async function addConversationNote(conversationId: string, body: string) {
  const session = await requireStaffSession();
  if (!body.trim()) return;

  await adminApiFetchServer(`/admin/communication/${conversationId}/notes`, session.accessToken, {
    method: "POST",
    body: JSON.stringify({ body: body.trim() }),
  });

  revalidatePath(`/admin/communication/${conversationId}`);
}

export async function claimConversation(conversationId: string) {
  const session = await requireStaffSession();
  await adminApiFetchServer(`/admin/communication/${conversationId}/claim`, session.accessToken, {
    method: "PATCH",
  });
  revalidatePath(`/admin/communication/${conversationId}`);
  revalidatePath("/admin/communication");
}

export async function transferConversation(conversationId: string, toAdminId: string) {
  const session = await requireStaffSession();
  await adminApiFetchServer(`/admin/communication/${conversationId}/transfer`, session.accessToken, {
    method: "PATCH",
    body: JSON.stringify({ toAdminId }),
  });
  revalidatePath(`/admin/communication/${conversationId}`);
  revalidatePath("/admin/communication");
}

export async function setConversationStatus(
  conversationId: string,
  status: "pending_visitor" | "closed" | "archived" | "open"
) {
  const session = await requireStaffSession();
  await adminApiFetchServer(`/admin/communication/${conversationId}/status`, session.accessToken, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
  revalidatePath(`/admin/communication/${conversationId}`);
  revalidatePath("/admin/communication");
}
