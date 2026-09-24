"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getAdminSession } from "@/lib/auth/get-admin";
import { isStaffOrAbove, canTransferConversation } from "@/lib/permissions";
import { writeAuditLog } from "@/lib/audit";

async function requireStaff() {
  const session = await getAdminSession();
  if (!isStaffOrAbove(session?.admin ?? null)) throw new Error("Not authorized.");
  return session!;
}

export async function sendStaffMessage(
  conversationId: string,
  body: string,
  attachmentMediaId?: string
) {
  const session = await requireStaff();
  if (!body.trim() && !attachmentMediaId) return;
  const supabase = await createClient();

  const { error } = await supabase.from("messages").insert({
    conversation_id: conversationId,
    sender_type: "staff",
    sender_admin_id: session.admin.id,
    body: body.trim() || null,
    attachment_media_id: attachmentMediaId ?? null,
  });

  if (error) throw new Error(error.message);

  // Sending a reply implicitly claims an unassigned conversation and marks
  // it assigned/in-progress.
  await supabase
    .from("conversations")
    .update({ assigned_to: session.admin.id, status: "assigned" })
    .eq("id", conversationId)
    .is("assigned_to", null);

  revalidatePath(`/admin/communication/${conversationId}`);
  revalidatePath("/admin/communication");
}

export async function addConversationNote(conversationId: string, body: string) {
  const session = await requireStaff();
  if (!body.trim()) return;
  const supabase = await createClient();

  const { error } = await supabase.from("conversation_notes").insert({
    conversation_id: conversationId,
    author_id: session.admin.id,
    body: body.trim(),
  });

  if (error) throw new Error(error.message);

  await writeAuditLog(supabase, {
    actorId: session.admin.id,
    action: "conversation.note_added",
    entityType: "conversations",
    entityId: conversationId,
  });

  revalidatePath(`/admin/communication/${conversationId}`);
}

export async function claimConversation(conversationId: string) {
  const session = await requireStaff();
  const supabase = await createClient();

  const { error } = await supabase
    .from("conversations")
    .update({ assigned_to: session.admin.id, status: "assigned" })
    .eq("id", conversationId);

  if (error) throw new Error(error.message);

  await writeAuditLog(supabase, {
    actorId: session.admin.id,
    action: "conversation.claim",
    entityType: "conversations",
    entityId: conversationId,
  });

  revalidatePath(`/admin/communication/${conversationId}`);
  revalidatePath("/admin/communication");
}

export async function transferConversation(conversationId: string, toAdminId: string) {
  const session = await requireStaff();
  const supabase = await createClient();

  const { data: conversation } = await supabase
    .from("conversations")
    .select("assigned_to")
    .eq("id", conversationId)
    .maybeSingle();

  if (!conversation || !canTransferConversation(session.admin, { assignedTo: conversation.assigned_to })) {
    throw new Error("Not authorized to transfer this conversation.");
  }

  const { error } = await supabase
    .from("conversations")
    .update({ assigned_to: toAdminId, status: "assigned" })
    .eq("id", conversationId);

  if (error) throw new Error(error.message);

  await writeAuditLog(supabase, {
    actorId: session.admin.id,
    action: "conversation.transfer",
    entityType: "conversations",
    entityId: conversationId,
    changes: { to: toAdminId },
  });

  revalidatePath(`/admin/communication/${conversationId}`);
  revalidatePath("/admin/communication");
}

export async function setConversationStatus(
  conversationId: string,
  status: "pending_visitor" | "closed" | "archived" | "open"
) {
  const session = await requireStaff();
  const supabase = await createClient();

  const { error } = await supabase.from("conversations").update({ status }).eq("id", conversationId);
  if (error) throw new Error(error.message);

  await writeAuditLog(supabase, {
    actorId: session.admin.id,
    action: "conversation.status_change",
    entityType: "conversations",
    entityId: conversationId,
    changes: { status },
  });

  revalidatePath(`/admin/communication/${conversationId}`);
  revalidatePath("/admin/communication");
}
