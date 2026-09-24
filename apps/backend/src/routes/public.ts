import { Router } from "express";
import { createAnonClient } from "../lib/supabase";
import { getMediaSignedUrl, getMediaWithSignedUrl } from "../lib/media-storage";

export const publicRouter = Router();

// ── Content (prophetic messages, sermons, articles) ────────────────────

publicRouter.get("/content", async (req, res) => {
  const supabase = createAnonClient();
  let query = supabase
    .from("content_items")
    .select("id, title, slug, summary, content_type, published_at, cover_media_id")
    .eq("status", "published")
    .order("published_at", { ascending: false });

  const limit = Number(req.query.limit);
  if (Number.isFinite(limit) && limit > 0) query = query.limit(limit);

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: "Query failed." });

  const items = await Promise.all(
    (data ?? []).map(async (item) => ({
      ...item,
      coverUrl: await getMediaSignedUrl(item.cover_media_id),
    }))
  );
  res.json(items);
});

publicRouter.get("/content/:slug", async (req, res) => {
  const supabase = createAnonClient();
  const { data: item, error } = await supabase
    .from("content_items")
    .select("title, summary, body, content_type, published_at, cover_media_id, media_id")
    .eq("slug", req.params.slug)
    .eq("status", "published")
    .maybeSingle();

  if (error || !item) return res.status(404).json({ error: "Not found." });

  const [coverUrl, media] = await Promise.all([
    getMediaSignedUrl(item.cover_media_id),
    getMediaWithSignedUrl(item.media_id),
  ]);

  res.json({ ...item, coverUrl, media });
});

// ── Events ───────────────────────────────────────────────────────────────

publicRouter.get("/events", async (req, res) => {
  const supabase = createAnonClient();
  let query = supabase
    .from("events")
    .select("id, title, slug, start_at, location_type, location_address, cover_media_id")
    .eq("status", "published")
    .order("start_at", { ascending: true });

  if (req.query.upcoming === "true") {
    query = query.gte("start_at", new Date().toISOString());
  }

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: "Query failed." });

  const events = await Promise.all(
    (data ?? []).map(async (event) => ({
      ...event,
      coverUrl: await getMediaSignedUrl(event.cover_media_id),
    }))
  );
  res.json(events);
});

publicRouter.get("/events/:slug", async (req, res) => {
  const supabase = createAnonClient();
  const { data: event, error } = await supabase
    .from("events")
    .select(
      "id, title, description, start_at, end_at, location_type, location_address, online_url, rsvp_enabled, status, cover_media_id"
    )
    .eq("slug", req.params.slug)
    .eq("status", "published")
    .maybeSingle();

  if (error || !event) return res.status(404).json({ error: "Not found." });

  const coverUrl = await getMediaSignedUrl(event.cover_media_id);
  res.json({ ...event, coverUrl });
});

// ── Coaching programs ────────────────────────────────────────────────────

publicRouter.get("/coaching-programs", async (_req, res) => {
  const supabase = createAnonClient();
  const { data, error } = await supabase
    .from("coaching_programs")
    .select("id, title, description, format, duration, price_amount, price_currency")
    .eq("status", "published")
    .order("created_at", { ascending: false });

  if (error) return res.status(500).json({ error: "Query failed." });
  res.json(data ?? []);
});

// ── Testimonies ──────────────────────────────────────────────────────────

publicRouter.get("/testimonies", async (_req, res) => {
  const supabase = createAnonClient();
  const { data, error } = await supabase
    .from("testimonies")
    .select("id, display_name, is_anonymous, body, is_featured, created_at")
    .eq("status", "approved")
    .order("is_featured", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) return res.status(500).json({ error: "Query failed." });
  res.json(data ?? []);
});

// ── Legal pages & settings ───────────────────────────────────────────────

publicRouter.get("/legal-pages/:type", async (req, res) => {
  if (!["privacy_policy", "terms_of_use"].includes(req.params.type)) {
    return res.status(400).json({ error: "Invalid legal page type." });
  }
  const supabase = createAnonClient();
  const { data, error } = await supabase
    .from("legal_pages")
    .select("body, updated_at")
    .eq("page_type", req.params.type)
    .maybeSingle();

  if (error) return res.status(500).json({ error: "Query failed." });
  res.json(data ?? { body: null, updated_at: null });
});

publicRouter.get("/settings", async (req, res) => {
  const keys = String(req.query.keys ?? "")
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);
  if (keys.length === 0) return res.json({});

  const supabase = createAnonClient();
  const { data, error } = await supabase.from("website_settings").select("key, value").in("key", keys);
  if (error) return res.status(500).json({ error: "Query failed." });

  const result: Record<string, unknown> = {};
  for (const row of data ?? []) result[row.key] = row.value;
  res.json(result);
});
