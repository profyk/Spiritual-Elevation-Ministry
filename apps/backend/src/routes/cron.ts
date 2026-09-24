import { Router } from "express";
import { createServiceRoleClient } from "../lib/supabase";
import { isAuthorizedCronRequest } from "../lib/cron-auth";
import { writeAuditLog } from "../lib/audit";

export const cronRouter = Router();

/** Flips content_items from 'scheduled' to 'published' once scheduled_for has passed (SPEC §23). */
cronRouter.post("/cron/publish-scheduled", async (req, res) => {
  if (!isAuthorizedCronRequest(req)) return res.status(401).json({ error: "Unauthorized." });

  const supabase = createServiceRoleClient();
  const now = new Date().toISOString();

  const { data: due, error: selectError } = await supabase
    .from("content_items")
    .select("id, title")
    .eq("status", "scheduled")
    .lte("scheduled_for", now);

  if (selectError) return res.status(500).json({ error: "Query failed." });
  if (!due || due.length === 0) return res.json({ published: 0 });

  const ids = due.map((item: { id: string }) => item.id);
  const { error: updateError } = await supabase
    .from("content_items")
    .update({ status: "published", published_at: now })
    .in("id", ids);

  if (updateError) return res.status(500).json({ error: "Update failed." });

  await Promise.all(
    due.map((item: { id: string; title: string }) =>
      writeAuditLog(supabase, {
        actorId: null,
        action: "content.auto_published",
        entityType: "content_items",
        entityId: item.id,
        changes: { title: item.title },
      })
    )
  );

  res.json({ published: due.length });
});

/**
 * Archives (never deletes — SPEC §28) closed conversations and resolved
 * ministry requests past the retention period.
 */
cronRouter.post("/cron/retention", async (req, res) => {
  if (!isAuthorizedCronRequest(req)) return res.status(401).json({ error: "Unauthorized." });

  const supabase = createServiceRoleClient();

  const { data: setting } = await supabase
    .from("website_settings")
    .select("value")
    .eq("key", "data_retention_months")
    .maybeSingle();

  const retentionMonths = Number(setting?.value ?? 24);
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - retentionMonths);
  const cutoffIso = cutoff.toISOString();

  const { data: conversations, error: conversationsError } = await supabase
    .from("conversations")
    .select("id")
    .eq("status", "closed")
    .lt("updated_at", cutoffIso);

  const { data: requests, error: requestsError } = await supabase
    .from("ministry_requests")
    .select("id")
    .eq("status", "resolved")
    .lt("updated_at", cutoffIso);

  if (conversationsError || requestsError) return res.status(500).json({ error: "Query failed." });

  const conversationIds = (conversations ?? []).map((c: { id: string }) => c.id);
  const requestIds = (requests ?? []).map((r: { id: string }) => r.id);

  if (conversationIds.length > 0) {
    await supabase.from("conversations").update({ status: "archived" }).in("id", conversationIds);
    await Promise.all(
      conversationIds.map((id: string) =>
        writeAuditLog(supabase, {
          actorId: null,
          action: "conversation.retention_archive",
          entityType: "conversations",
          entityId: id,
          changes: { retentionMonths },
        })
      )
    );
  }

  if (requestIds.length > 0) {
    await supabase.from("ministry_requests").update({ status: "archived" }).in("id", requestIds);
    await Promise.all(
      requestIds.map((id: string) =>
        writeAuditLog(supabase, {
          actorId: null,
          action: "ministry_request.retention_archive",
          entityType: "ministry_requests",
          entityId: id,
          changes: { retentionMonths },
        })
      )
    );
  }

  res.json({ archivedConversations: conversationIds.length, archivedRequests: requestIds.length, retentionMonths });
});
