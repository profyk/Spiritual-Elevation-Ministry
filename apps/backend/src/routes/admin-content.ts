import { Router } from "express";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireAdmin } from "../middleware/auth";
import { writeAuditLog } from "../lib/audit";
import { contentItemSchema, eventSchema, coachingProgramSchema } from "@sem/shared";

export const adminContentRouter = Router();

/**
 * Alt text (SPEC §33) lives on the media row, not the content/event row
 * that references it — the schema's .refine() already guarantees it's
 * present whenever coverMediaId is, so this only runs when there's
 * something to write.
 */
async function setCoverAltText(
  client: SupabaseClient,
  coverMediaId: string | null | undefined,
  altText: string | undefined
): Promise<void> {
  if (!coverMediaId || !altText) return;
  await client.from("media").update({ alt_text: altText }).eq("id", coverMediaId);
}

// ── Content (prophetic messages, sermons, articles) — staff+ writes,
// moderator+ reads (SPEC §21 "content review") ──────────────────────────

adminContentRouter.get("/content", requireAdmin("moderator"), async (req, res) => {
  const { data, error } = await req.userClient!
    .from("content_items")
    .select("id, title, content_type, status, updated_at")
    .order("updated_at", { ascending: false });
  if (error) return res.status(500).json({ error: "Query failed." });
  res.json(data ?? []);
});

adminContentRouter.get("/content/:id", requireAdmin("moderator"), async (req, res) => {
  const { data, error } = await req.userClient!
    .from("content_items")
    .select(
      "content_type, title, slug, summary, body, category, tags, status, scheduled_for, cover_media_id, media_id, cover:cover_media_id(alt_text)"
    )
    .eq("id", req.params.id)
    .maybeSingle();
  if (error || !data) return res.status(404).json({ error: "Not found." });
  const { cover, ...item } = data as typeof data & { cover: { alt_text: string | null } | null };
  res.json({ ...item, coverMediaAltText: cover?.alt_text ?? null });
});

adminContentRouter.post("/content", requireAdmin("staff"), async (req, res) => {
  const parsed = contentItemSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input.", issues: parsed.error.flatten() });

  const { data, error } = await req.userClient!
    .from("content_items")
    .insert({
      content_type: parsed.data.contentType,
      title: parsed.data.title,
      slug: parsed.data.slug,
      summary: parsed.data.summary ?? null,
      body: parsed.data.body ?? null,
      category: parsed.data.category ?? null,
      tags: parsed.data.tags,
      status: parsed.data.status,
      published_at: parsed.data.status === "published" ? new Date().toISOString() : null,
      scheduled_for: parsed.data.scheduledFor,
      author_id: req.admin!.id,
      cover_media_id: parsed.data.coverMediaId,
      media_id: parsed.data.mediaId,
    })
    .select("id")
    .single();

  if (error) return res.status(500).json({ error: error.message });

  await setCoverAltText(req.userClient!, parsed.data.coverMediaId, parsed.data.coverMediaAltText);

  await writeAuditLog(req.userClient!, {
    actorId: req.admin!.id,
    action: "content.create",
    entityType: "content_items",
    entityId: data.id,
    changes: { title: parsed.data.title, status: parsed.data.status },
  });

  res.status(201).json({ id: data.id });
});

adminContentRouter.patch("/content/:id", requireAdmin("staff"), async (req, res) => {
  const parsed = contentItemSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input.", issues: parsed.error.flatten() });

  const { data: existing } = await req.userClient!
    .from("content_items")
    .select("status")
    .eq("id", req.params.id)
    .maybeSingle();
  const becomingPublished = parsed.data.status === "published" && existing?.status !== "published";

  const { error } = await req.userClient!
    .from("content_items")
    .update({
      content_type: parsed.data.contentType,
      title: parsed.data.title,
      slug: parsed.data.slug,
      summary: parsed.data.summary ?? null,
      body: parsed.data.body ?? null,
      category: parsed.data.category ?? null,
      tags: parsed.data.tags,
      status: parsed.data.status,
      published_at: becomingPublished ? new Date().toISOString() : undefined,
      scheduled_for: parsed.data.scheduledFor,
      cover_media_id: parsed.data.coverMediaId,
      media_id: parsed.data.mediaId,
    })
    .eq("id", req.params.id);

  if (error) return res.status(500).json({ error: error.message });

  await setCoverAltText(req.userClient!, parsed.data.coverMediaId, parsed.data.coverMediaAltText);

  await writeAuditLog(req.userClient!, {
    actorId: req.admin!.id,
    action: "content.update",
    entityType: "content_items",
    entityId: req.params.id,
    changes: { title: parsed.data.title, status: parsed.data.status },
  });

  res.json({ ok: true });
});

// ── Events — staff+ only ─────────────────────────────────────────────────

adminContentRouter.get("/events", requireAdmin("staff"), async (req, res) => {
  const { data, error } = await req.userClient!
    .from("events")
    .select("id, title, status, start_at, rsvp_enabled")
    .order("start_at", { ascending: false });
  if (error) return res.status(500).json({ error: "Query failed." });
  res.json(data ?? []);
});

adminContentRouter.get("/events/:id", requireAdmin("staff"), async (req, res) => {
  const { data, error } = await req.userClient!
    .from("events")
    .select(
      "title, slug, description, start_at, end_at, location_type, location_address, online_url, status, rsvp_enabled, capacity, cover_media_id, cover:cover_media_id(alt_text)"
    )
    .eq("id", req.params.id)
    .maybeSingle();
  if (error || !data) return res.status(404).json({ error: "Not found." });
  const { cover, ...event } = data as typeof data & { cover: { alt_text: string | null } | null };
  res.json({ ...event, coverMediaAltText: cover?.alt_text ?? null });
});

adminContentRouter.post("/events", requireAdmin("staff"), async (req, res) => {
  const parsed = eventSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input.", issues: parsed.error.flatten() });

  const { data, error } = await req.userClient!
    .from("events")
    .insert({
      title: parsed.data.title,
      slug: parsed.data.slug,
      description: parsed.data.description ?? null,
      start_at: parsed.data.startAt,
      end_at: parsed.data.endAt ?? null,
      location_type: parsed.data.locationType,
      location_address: parsed.data.locationAddress ?? null,
      online_url: parsed.data.onlineUrl || null,
      status: parsed.data.status,
      rsvp_enabled: parsed.data.rsvpEnabled,
      capacity: parsed.data.capacity ?? null,
      cover_media_id: parsed.data.coverMediaId,
    })
    .select("id")
    .single();

  if (error) return res.status(500).json({ error: error.message });

  await setCoverAltText(req.userClient!, parsed.data.coverMediaId, parsed.data.coverMediaAltText);

  await writeAuditLog(req.userClient!, {
    actorId: req.admin!.id,
    action: "event.create",
    entityType: "events",
    entityId: data.id,
  });

  res.status(201).json({ id: data.id });
});

adminContentRouter.patch("/events/:id", requireAdmin("staff"), async (req, res) => {
  const parsed = eventSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input.", issues: parsed.error.flatten() });

  const { error } = await req.userClient!
    .from("events")
    .update({
      title: parsed.data.title,
      slug: parsed.data.slug,
      description: parsed.data.description ?? null,
      start_at: parsed.data.startAt,
      end_at: parsed.data.endAt ?? null,
      location_type: parsed.data.locationType,
      location_address: parsed.data.locationAddress ?? null,
      online_url: parsed.data.onlineUrl || null,
      status: parsed.data.status,
      rsvp_enabled: parsed.data.rsvpEnabled,
      capacity: parsed.data.capacity ?? null,
      cover_media_id: parsed.data.coverMediaId,
    })
    .eq("id", req.params.id);

  if (error) return res.status(500).json({ error: error.message });

  await setCoverAltText(req.userClient!, parsed.data.coverMediaId, parsed.data.coverMediaAltText);

  await writeAuditLog(req.userClient!, {
    actorId: req.admin!.id,
    action: "event.update",
    entityType: "events",
    entityId: req.params.id,
  });

  res.json({ ok: true });
});

adminContentRouter.get("/events/:id/rsvps", requireAdmin("staff"), async (req, res) => {
  const { data, error } = await req.userClient!
    .from("event_rsvps")
    .select("id, name, contact_email, contact_phone, attendee_count, created_at")
    .eq("event_id", req.params.id)
    .order("created_at", { ascending: false });
  if (error) return res.status(500).json({ error: "Query failed." });
  res.json(data ?? []);
});

// ── Coaching programs — staff+ only ──────────────────────────────────────

adminContentRouter.get("/coaching-programs", requireAdmin("staff"), async (req, res) => {
  const { data, error } = await req.userClient!
    .from("coaching_programs")
    .select("id, title, status, price_amount, price_currency")
    .order("created_at", { ascending: false });
  if (error) return res.status(500).json({ error: "Query failed." });
  res.json(data ?? []);
});

adminContentRouter.get("/coaching-programs/:id", requireAdmin("staff"), async (req, res) => {
  const { data, error } = await req.userClient!
    .from("coaching_programs")
    .select("title, slug, description, format, duration, price_amount, price_currency, capacity, status")
    .eq("id", req.params.id)
    .maybeSingle();
  if (error || !data) return res.status(404).json({ error: "Not found." });
  res.json(data);
});

adminContentRouter.post("/coaching-programs", requireAdmin("staff"), async (req, res) => {
  const parsed = coachingProgramSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input.", issues: parsed.error.flatten() });

  const { data, error } = await req.userClient!
    .from("coaching_programs")
    .insert({
      title: parsed.data.title,
      slug: parsed.data.slug,
      description: parsed.data.description ?? null,
      format: parsed.data.format ?? null,
      duration: parsed.data.duration ?? null,
      price_amount: parsed.data.priceAmount ?? null,
      price_currency: parsed.data.priceCurrency,
      capacity: parsed.data.capacity ?? null,
      status: parsed.data.status,
    })
    .select("id")
    .single();

  if (error) return res.status(500).json({ error: error.message });

  await writeAuditLog(req.userClient!, {
    actorId: req.admin!.id,
    action: "coaching_program.create",
    entityType: "coaching_programs",
    entityId: data.id,
  });

  res.status(201).json({ id: data.id });
});

adminContentRouter.patch("/coaching-programs/:id", requireAdmin("staff"), async (req, res) => {
  const parsed = coachingProgramSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input.", issues: parsed.error.flatten() });

  const { error } = await req.userClient!
    .from("coaching_programs")
    .update({
      title: parsed.data.title,
      slug: parsed.data.slug,
      description: parsed.data.description ?? null,
      format: parsed.data.format ?? null,
      duration: parsed.data.duration ?? null,
      price_amount: parsed.data.priceAmount ?? null,
      price_currency: parsed.data.priceCurrency,
      capacity: parsed.data.capacity ?? null,
      status: parsed.data.status,
    })
    .eq("id", req.params.id);

  if (error) return res.status(500).json({ error: error.message });

  await writeAuditLog(req.userClient!, {
    actorId: req.admin!.id,
    action: "coaching_program.update",
    entityType: "coaching_programs",
    entityId: req.params.id,
  });

  res.json({ ok: true });
});
