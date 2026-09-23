import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { startConversationSchema } from "@/lib/validation/chat";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { notifyAdmins } from "@/lib/notifications";

// SPEC §30: rate-limit conversation creation.
const RATE_LIMIT = { limit: 5, windowMs: 60 * 60 * 1000 };

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const { allowed } = checkRateLimit(`conversation:${ip}`, RATE_LIMIT);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many conversations started. Please try again later." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = startConversationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input.", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  // The visitor must already hold an anonymous Supabase session (created
  // client-side via supabase.auth.signInAnonymously() before this call) —
  // conversations.visitor_auth_id is keyed to that id, and RLS's insert
  // policy requires it to equal auth.uid() (SPEC §15).
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "No visitor session. Start an anonymous session before chatting." },
      { status: 401 }
    );
  }

  const { data: conversation, error: conversationError } = await supabase
    .from("conversations")
    .insert({
      visitor_auth_id: user.id,
      channel: "webchat",
      service_context: parsed.data.serviceContext,
      visitor_name: parsed.data.visitorName,
      visitor_contact_email: parsed.data.contactEmail ?? null,
      visitor_contact_phone: parsed.data.contactPhone ?? null,
    })
    .select("id")
    .single();

  if (conversationError) {
    console.error("conversations insert failed", conversationError);
    return NextResponse.json({ error: "Could not start conversation." }, { status: 500 });
  }

  const { error: messageError } = await supabase.from("messages").insert({
    conversation_id: conversation.id,
    sender_type: "visitor",
    sender_visitor_auth_id: user.id,
    body: parsed.data.firstMessage,
  });

  if (messageError) {
    console.error("first message insert failed", messageError);
    return NextResponse.json({ error: "Could not send your message." }, { status: 500 });
  }

  await notifyAdmins({
    category: "new_conversation",
    title: "New chat conversation",
    body: `${parsed.data.visitorName} started a chat (${parsed.data.serviceContext.replace("_", " ")}).`,
    linkPath: `/admin/communication/${conversation.id}`,
  });

  return NextResponse.json({ conversationId: conversation.id }, { status: 201 });
}
