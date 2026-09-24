import { Router } from "express";
import { createServiceRoleClient } from "../lib/supabase";
import { requireVisitor } from "../middleware/auth";
import { checkRateLimit, getClientIp } from "../lib/rate-limit";
import { notifyAdmins } from "../lib/notifications";
import { startConversationSchema, sendMessageSchema } from "@sem/shared";

export const chatRouter = Router();

const CONVERSATION_RATE_LIMIT = { limit: 5, windowMs: 60 * 60 * 1000 };
const MESSAGE_RATE_LIMIT = { limit: 60, windowMs: 60 * 60 * 1000 };

// SPEC §15: everything below runs on the CALLER'S OWN token-scoped client
// (req.userClient), never the service role — RLS is what actually decides
// what a visitor or staff member can see and do here.

chatRouter.post("/conversations", requireVisitor, async (req, res) => {
  const { allowed } = checkRateLimit(`conversation:${getClientIp(req)}`, CONVERSATION_RATE_LIMIT);
  if (!allowed) return res.status(429).json({ error: "Too many conversations started. Please try again later." });

  const parsed = startConversationSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid input.", issues: parsed.error.flatten() });
  }

  const supabase = req.userClient!;
  const { data: conversation, error: conversationError } = await supabase
    .from("conversations")
    .insert({
      visitor_auth_id: req.userId,
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
    return res.status(500).json({ error: "Could not start conversation." });
  }

  const { error: messageError } = await supabase.from("messages").insert({
    conversation_id: conversation.id,
    sender_type: "visitor",
    sender_visitor_auth_id: req.userId,
    body: parsed.data.firstMessage,
  });

  if (messageError) {
    console.error("first message insert failed", messageError);
    return res.status(500).json({ error: "Could not send your message." });
  }

  await notifyAdmins({
    category: "new_conversation",
    title: "New chat conversation",
    body: `${parsed.data.visitorName} started a chat (${parsed.data.serviceContext.replace("_", " ")}).`,
    linkPath: `/admin/communication/${conversation.id}`,
  });

  res.status(201).json({ conversationId: conversation.id });
});

chatRouter.get("/conversations/:id/messages", requireVisitor, async (req, res) => {
  const supabase = req.userClient!;
  // RLS scopes this to conversations the caller may see (their own, for a
  // visitor; any, for staff) — an empty/denied result looks identical here
  // to "no messages yet", which is fine: it never leaks existence either way.
  const { data, error } = await supabase
    .from("messages")
    .select("id, sender_type, body, attachment_media_id, created_at")
    .eq("conversation_id", req.params.id)
    .order("created_at", { ascending: true });

  if (error) return res.status(500).json({ error: "Query failed." });
  res.json(data ?? []);
});

chatRouter.post("/messages", requireVisitor, async (req, res) => {
  const { allowed } = checkRateLimit(`message:${getClientIp(req)}`, MESSAGE_RATE_LIMIT);
  if (!allowed) return res.status(429).json({ error: "Too many messages sent. Please slow down." });

  const parsed = sendMessageSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid input.", issues: parsed.error.flatten() });
  }

  const supabase = req.userClient!;

  const { data: conversation } = await supabase
    .from("conversations")
    .select("id, status, visitor_auth_id")
    .eq("id", parsed.data.conversationId)
    .maybeSingle();

  if (!conversation) return res.status(404).json({ error: "Conversation not found." });

  const isVisitorSender = conversation.visitor_auth_id === req.userId;

  if (!isVisitorSender) {
    // Not this conversation's own visitor — the only other legitimate
    // sender is staff+. Check explicitly rather than assuming "not the
    // visitor" means "must be staff" and letting a stranger's request
    // fail opaquely on the RLS insert policy below.
    const { data: adminRow } = await supabase
      .from("admin_users")
      .select("id")
      .eq("id", req.userId)
      .eq("is_active", true)
      .maybeSingle();
    if (!adminRow) return res.status(403).json({ error: "Not authorized." });
  }

  if (parsed.data.attachmentMediaId) {
    // RLS's media-select policies (own upload, or attached to own
    // conversation) are the ownership check here, same as before.
    const { data: ownedMedia } = await supabase
      .from("media")
      .select("id")
      .eq("id", parsed.data.attachmentMediaId)
      .maybeSingle();
    if (!ownedMedia) return res.status(404).json({ error: "Attachment not found." });
  }

  const { error } = await supabase.from("messages").insert({
    conversation_id: parsed.data.conversationId,
    sender_type: isVisitorSender ? "visitor" : "staff",
    sender_visitor_auth_id: isVisitorSender ? req.userId : null,
    sender_admin_id: isVisitorSender ? null : req.userId,
    body: parsed.data.body ?? null,
    attachment_media_id: parsed.data.attachmentMediaId ?? null,
  });

  if (error) {
    console.error("message insert failed", error);
    return res.status(500).json({ error: "Could not send message." });
  }

  if (isVisitorSender && conversation.status === "pending_visitor") {
    // Visitors have no RLS update policy on conversations by design (SPEC
    // §16) — this one narrow, well-defined transition goes through the
    // service-role client instead of loosening RLS for it.
    const serviceClient = createServiceRoleClient();
    await serviceClient.from("conversations").update({ status: "assigned" }).eq("id", conversation.id);
  } else if (!isVisitorSender) {
    // A staff reply implicitly claims an unassigned conversation.
    await supabase
      .from("conversations")
      .update({ assigned_to: req.userId, status: "assigned" })
      .eq("id", conversation.id)
      .is("assigned_to", null);
  }

  res.status(201).json({ ok: true });
});
