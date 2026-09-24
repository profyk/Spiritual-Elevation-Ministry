import { notFound } from "next/navigation";
import { getAdminSession } from "@/lib/auth/get-admin";
import { adminApiFetchServer } from "@/lib/api-client";
import { StaffChatThread } from "@/components/admin/StaffChatThread";
import { ConversationNotes } from "@/components/admin/ConversationNotes";
import { ConversationActions } from "@/components/admin/ConversationActions";

interface ConversationDetail {
  id: string;
  visitor_name: string;
  visitor_contact_email: string | null;
  visitor_contact_phone: string | null;
  service_context: string;
  status: string;
  assigned_to: string | null;
  channel: string;
  created_at: string;
}

interface ConversationNote {
  id: string;
  body: string;
  created_at: string;
  author_id: string;
}

interface ChatMessage {
  id: string;
  sender_type: "visitor" | "staff" | "system";
  body: string | null;
  attachment_media_id: string | null;
  created_at: string;
}

export default async function ConversationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getAdminSession();
  if (!session) notFound();

  type CommunicationDetail = {
    conversation: ConversationDetail;
    notes: ConversationNote[];
    staffOptions: { id: string; full_name: string }[];
  };

  let detail: CommunicationDetail;
  let messages: ChatMessage[];
  try {
    [detail, messages] = await Promise.all([
      adminApiFetchServer<CommunicationDetail>(`/admin/communication/${id}`, session.accessToken),
      adminApiFetchServer<ChatMessage[]>(`/conversations/${id}/messages`, session.accessToken),
    ]);
  } catch {
    notFound();
  }

  const { conversation, notes, staffOptions } = detail;

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
          staffOptions={staffOptions}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[2fr_1fr]">
        <StaffChatThread conversationId={conversation.id} initialMessages={messages} />
        <ConversationNotes conversationId={conversation.id} initialNotes={notes} />
      </div>
    </div>
  );
}
