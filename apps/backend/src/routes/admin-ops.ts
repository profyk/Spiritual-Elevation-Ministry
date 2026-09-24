import { Router } from "express";
import { requireAdmin } from "../middleware/auth";
import { writeAuditLog } from "../lib/audit";
import { canTransferConversation } from "@sem/shared";
import type { AdminRole } from "@sem/shared";

export const adminOpsRouter = Router();

// ── Session / dashboard ─────────────────────────────────────────────────

adminOpsRouter.get("/me", requireAdmin("moderator"), async (req, res) => {
  res.json(req.admin);
});

adminOpsRouter.get("/dashboard-counts", requireAdmin("moderator"), async (req, res) => {
  const client = req.userClient!;
  const [{ count: newRequests }, { count: openConversations }, { count: pendingTestimonies }] = await Promise.all([
    client.from("ministry_requests").select("*", { count: "exact", head: true }).eq("status", "new"),
    client.from("conversations").select("*", { count: "exact", head: true }).in("status", ["open", "assigned"]),
    client.from("testimonies").select("*", { count: "exact", head: true }).eq("status", "pending"),
  ]);
  res.json({ newRequests: newRequests ?? 0, openConversations: openConversations ?? 0, pendingTestimonies: pendingTestimonies ?? 0 });
});

// ── Testimony moderation — moderator+ (SPEC §21) ────────────────────────

adminOpsRouter.get("/testimonies", requireAdmin("moderator"), async (req, res) => {
  const { data, error } = await req.userClient!
    .from("testimonies")
    .select("id, display_name, is_anonymous, body, status, is_featured, created_at")
    .neq("status", "archived")
    .order("status", { ascending: true })
    .order("created_at", { ascending: false });
  if (error) return res.status(500).json({ error: "Query failed." });
  res.json(data ?? []);
});

adminOpsRouter.patch("/testimonies/:id/moderate", requireAdmin("moderator"), async (req, res) => {
  const decision = req.body?.decision;
  if (decision !== "approved" && decision !== "rejected") {
    return res.status(400).json({ error: "decision must be 'approved' or 'rejected'." });
  }

  const { error } = await req.userClient!
    .from("testimonies")
    .update({
      status: decision,
      internal_reason: decision === "rejected" ? req.body?.internalReason ?? null : null,
      moderated_by: req.admin!.id,
      moderated_at: new Date().toISOString(),
    })
    .eq("id", req.params.id);
  if (error) return res.status(500).json({ error: error.message });

  await writeAuditLog(req.userClient!, {
    actorId: req.admin!.id,
    action: `testimony.${decision}`,
    entityType: "testimonies",
    entityId: req.params.id,
  });

  res.json({ ok: true });
});

adminOpsRouter.patch("/testimonies/:id/feature", requireAdmin("moderator"), async (req, res) => {
  const featured = Boolean(req.body?.featured);
  const { error } = await req.userClient!.from("testimonies").update({ is_featured: featured }).eq("id", req.params.id);
  if (error) return res.status(500).json({ error: error.message });

  await writeAuditLog(req.userClient!, {
    actorId: req.admin!.id,
    action: "testimony.feature_toggle",
    entityType: "testimonies",
    entityId: req.params.id,
    changes: { is_featured: featured },
  });

  res.json({ ok: true });
});

adminOpsRouter.patch("/testimonies/:id/archive", requireAdmin("moderator"), async (req, res) => {
  const { error } = await req.userClient!.from("testimonies").update({ status: "archived" }).eq("id", req.params.id);
  if (error) return res.status(500).json({ error: error.message });

  await writeAuditLog(req.userClient!, {
    actorId: req.admin!.id,
    action: "testimony.archive",
    entityType: "testimonies",
    entityId: req.params.id,
  });

  res.json({ ok: true });
});

// ── Unified ministry requests inbox — staff+ ────────────────────────────

adminOpsRouter.get("/requests", requireAdmin("staff"), async (req, res) => {
  const status = ["new", "in_progress", "resolved", "archived"].includes(String(req.query.status))
    ? String(req.query.status)
    : "new";

  const { data, error } = await req.userClient!
    .from("ministry_requests")
    .select(
      "id, request_type, concerns_missing_person, name, contact_email, contact_phone, details, status, assigned_to, created_at"
    )
    .eq("status", status)
    .order("created_at", { ascending: false });
  if (error) return res.status(500).json({ error: "Query failed." });
  res.json(data ?? []);
});

adminOpsRouter.patch("/requests/:id/claim", requireAdmin("staff"), async (req, res) => {
  const { error } = await req.userClient!
    .from("ministry_requests")
    .update({ assigned_to: req.admin!.id, status: "in_progress" })
    .eq("id", req.params.id);
  if (error) return res.status(500).json({ error: error.message });

  await writeAuditLog(req.userClient!, {
    actorId: req.admin!.id,
    action: "request.claim",
    entityType: "ministry_requests",
    entityId: req.params.id,
  });

  res.json({ ok: true });
});

adminOpsRouter.patch("/requests/:id/status", requireAdmin("staff"), async (req, res) => {
  const status = req.body?.status;
  if (!["in_progress", "resolved", "archived"].includes(status)) {
    return res.status(400).json({ error: "Invalid status." });
  }

  const { error } = await req.userClient!.from("ministry_requests").update({ status }).eq("id", req.params.id);
  if (error) return res.status(500).json({ error: error.message });

  await writeAuditLog(req.userClient!, {
    actorId: req.admin!.id,
    action: "request.status_change",
    entityType: "ministry_requests",
    entityId: req.params.id,
    changes: { status },
  });

  res.json({ ok: true });
});

// ── Communication center — staff+ ────────────────────────────────────────
// (Message send/read is shared with the visitor side — see routes/chat.ts,
// POST /messages and GET /conversations/:id/messages — since the same
// endpoints already branch correctly on caller identity.)

adminOpsRouter.get("/communication", requireAdmin("staff"), async (req, res) => {
  const tabs: Record<string, string[]> = {
    active: ["open", "assigned", "pending_visitor"],
    closed: ["closed"],
    archived: ["archived"],
  };
  const statuses = tabs[String(req.query.tab)] ?? tabs.active;

  const { data, error } = await req.userClient!
    .from("conversations")
    .select("id, visitor_name, service_context, status, assigned_to, updated_at")
    .in("status", statuses)
    .order("updated_at", { ascending: false });
  if (error) return res.status(500).json({ error: "Query failed." });
  res.json(data ?? []);
});

adminOpsRouter.get("/communication/:id", requireAdmin("staff"), async (req, res) => {
  const client = req.userClient!;
  const [{ data: conversation }, { data: notes }, { data: staffOptions }] = await Promise.all([
    client
      .from("conversations")
      .select(
        "id, visitor_name, visitor_contact_email, visitor_contact_phone, service_context, status, assigned_to, channel, created_at"
      )
      .eq("id", req.params.id)
      .maybeSingle(),
    client
      .from("conversation_notes")
      .select("id, body, created_at, author_id")
      .eq("conversation_id", req.params.id)
      .order("created_at", { ascending: false }),
    client.from("admin_users").select("id, full_name").eq("is_active", true),
  ]);

  if (!conversation) return res.status(404).json({ error: "Not found." });
  res.json({ conversation, notes: notes ?? [], staffOptions: staffOptions ?? [] });
});

adminOpsRouter.post("/communication/:id/notes", requireAdmin("staff"), async (req, res) => {
  const body = String(req.body?.body ?? "").trim();
  if (!body) return res.status(400).json({ error: "Note body is required." });

  const { error } = await req.userClient!.from("conversation_notes").insert({
    conversation_id: req.params.id,
    author_id: req.admin!.id,
    body,
  });
  if (error) return res.status(500).json({ error: error.message });

  await writeAuditLog(req.userClient!, {
    actorId: req.admin!.id,
    action: "conversation.note_added",
    entityType: "conversations",
    entityId: req.params.id,
  });

  res.status(201).json({ ok: true });
});

adminOpsRouter.patch("/communication/:id/claim", requireAdmin("staff"), async (req, res) => {
  const { error } = await req.userClient!
    .from("conversations")
    .update({ assigned_to: req.admin!.id, status: "assigned" })
    .eq("id", req.params.id);
  if (error) return res.status(500).json({ error: error.message });

  await writeAuditLog(req.userClient!, {
    actorId: req.admin!.id,
    action: "conversation.claim",
    entityType: "conversations",
    entityId: req.params.id,
  });

  res.json({ ok: true });
});

adminOpsRouter.patch("/communication/:id/transfer", requireAdmin("staff"), async (req, res) => {
  const toAdminId = String(req.body?.toAdminId ?? "");
  if (!toAdminId) return res.status(400).json({ error: "toAdminId is required." });

  const { data: conversation } = await req.userClient!
    .from("conversations")
    .select("assigned_to")
    .eq("id", req.params.id)
    .maybeSingle();

  if (
    !conversation ||
    !canTransferConversation(req.admin as { id: string; role: AdminRole; isActive: boolean }, {
      assignedTo: conversation.assigned_to,
    })
  ) {
    return res.status(403).json({ error: "Not authorized to transfer this conversation." });
  }

  const { error } = await req.userClient!
    .from("conversations")
    .update({ assigned_to: toAdminId, status: "assigned" })
    .eq("id", req.params.id);
  if (error) return res.status(500).json({ error: error.message });

  await writeAuditLog(req.userClient!, {
    actorId: req.admin!.id,
    action: "conversation.transfer",
    entityType: "conversations",
    entityId: req.params.id,
    changes: { to: toAdminId },
  });

  res.json({ ok: true });
});

adminOpsRouter.patch("/communication/:id/status", requireAdmin("staff"), async (req, res) => {
  const status = req.body?.status;
  if (!["open", "pending_visitor", "closed", "archived"].includes(status)) {
    return res.status(400).json({ error: "Invalid status." });
  }

  const { error } = await req.userClient!.from("conversations").update({ status }).eq("id", req.params.id);
  if (error) return res.status(500).json({ error: error.message });

  await writeAuditLog(req.userClient!, {
    actorId: req.admin!.id,
    action: "conversation.status_change",
    entityType: "conversations",
    entityId: req.params.id,
    changes: { status },
  });

  res.json({ ok: true });
});

