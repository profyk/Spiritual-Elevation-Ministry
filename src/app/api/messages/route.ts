import { NextResponse } from "next/server";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { sendMessageSchema } from "@/lib/validation/chat";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

// SPEC §30: rate-limit message sending. This route is for visitor-sent
// messages only — staff messages go through the admin communication
// center's server actions, which are already behind admin auth.
const RATE_LIMIT = { limit: 60, windowMs: 60 * 60 * 1000 };

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const { allowed } = checkRateLimit(`message:${ip}`, RATE_LIMIT);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many messages sent. Please slow down." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = sendMessageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input.", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No visitor session." }, { status: 401 });
  }

  // RLS's insert policy independently enforces that conversationId belongs
  // to this visitor — this existence check just produces a clean 404
  // instead of a raw RLS-denied insert error.
  const { data: conversation } = await supabase
    .from("conversations")
    .select("id, status")
    .eq("id", parsed.data.conversationId)
    .eq("visitor_auth_id", user.id)
    .maybeSingle();

  if (!conversation) {
    return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
  }

  if (parsed.data.attachmentMediaId) {
    // RLS's "visitor reads own uploaded media" policy means this lookup
    // itself is the ownership check — it returns nothing for anyone else's
    // media id, not just their own.
    const { data: ownedMedia } = await supabase
      .from("media")
      .select("id")
      .eq("id", parsed.data.attachmentMediaId)
      .maybeSingle();
    if (!ownedMedia) {
      return NextResponse.json({ error: "Attachment not found." }, { status: 404 });
    }
  }

  const { error } = await supabase.from("messages").insert({
    conversation_id: parsed.data.conversationId,
    sender_type: "visitor",
    sender_visitor_auth_id: user.id,
    body: parsed.data.body ?? null,
    attachment_media_id: parsed.data.attachmentMediaId ?? null,
  });

  if (error) {
    console.error("message insert failed", error);
    return NextResponse.json({ error: "Could not send message." }, { status: 500 });
  }

  // A visitor sending a message after the ministry marked it "pending
  // visitor" reopens it back to "assigned" so it resurfaces for staff.
  // Visitors have no RLS update policy on conversations (deliberately —
  // they can add messages, not change conversation state themselves), so
  // this one narrow, well-defined transition goes through the service-role
  // client rather than loosening RLS for it.
  if (conversation.status === "pending_visitor") {
    const serviceClient = createServiceRoleClient();
    await serviceClient
      .from("conversations")
      .update({ status: "assigned" })
      .eq("id", conversation.id);
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
