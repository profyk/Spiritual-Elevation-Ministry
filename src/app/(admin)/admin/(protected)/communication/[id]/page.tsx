import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StaffChatThread } from "@/components/admin/StaffChatThread";
import { ConversationNotes } from "@/components/admin/ConversationNotes";
import { ConversationActions } from "@/components/admin/ConversationActions";

export default async function ConversationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: conversation }, { data: messages }, { data: notes }, { data: staffOptions }] =
    await Promise.all([
      supabase
        .from("conversations")
        .select(
          "id, visitor_name, visitor_contact_email, visitor_contact_phone, service_context, status, assigned_to, channel, created_at"
        )
        .eq("id", id)
        .maybeSingle(),
      supabase
        .from("messages")
        .select("id, sender_type, body, attachment_media_id, created_at")
        .eq("conversation_id", id)
        .order("created_at", { ascending: true }),
      supabase
        .from("conversation_notes")
        .select("id, body, created_at, author_id")
        .eq("conversation_id", id)
        .order("created_at", { ascending: false }),
      supabase.from("admin_users").select("id, full_name").eq("is_active", true),
    ]);

  if (!conversation) notFound();

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-xl font-semibold">{conversation.visitor_name}</h1>
        <p className="text-sm text-neutral-500">
          {[conversation.visitor_contact_email, conversation.visitor_contact_phone]
            .filter(Boolean)
            .join(" · ")}{" "}
          · <span className="capitalize">{conversation.service_context.replace("_", " ")}</span> ·{" "}
          {conversation.channel}
        </p>
      </div>

      <div className="mb-4">
        <ConversationActions
          conversationId={conversation.id}
          status={conversation.status}
          assignedTo={conversation.assigned_to}
          staffOptions={staffOptions ?? []}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[2fr_1fr]">
        <StaffChatThread conversationId={conversation.id} initialMessages={messages ?? []} />
        <ConversationNotes conversationId={conversation.id} initialNotes={notes ?? []} />
      </div>
    </div>
  );
}
