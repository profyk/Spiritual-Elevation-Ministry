import { Router } from "express";
import { createAnonClient } from "../lib/supabase";
import { checkRateLimit, getClientIp } from "../lib/rate-limit";
import { notifyAdmins } from "../lib/notifications";
import { sendEmail } from "../lib/email-resend";
import {
  createMinistryRequestSchema,
  createEventRsvpSchema,
  createTestimonySchema,
  visitorRequestConfirmationEmail,
} from "@sem/shared";

export const submissionsRouter = Router();

// SPEC §30: rate-limit every public form submission.
const REQUEST_RATE_LIMIT = { limit: 10, windowMs: 60 * 60 * 1000 };
const RSVP_RATE_LIMIT = { limit: 10, windowMs: 60 * 60 * 1000 };
const TESTIMONY_RATE_LIMIT = { limit: 5, windowMs: 60 * 60 * 1000 };

submissionsRouter.post("/requests", async (req, res) => {
  const { allowed } = checkRateLimit(`ministry_request:${getClientIp(req)}`, REQUEST_RATE_LIMIT);
  if (!allowed) return res.status(429).json({ error: "Too many requests. Please try again later." });

  const parsed = createMinistryRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid input.", issues: parsed.error.flatten() });
  }

  const supabase = createAnonClient();
  const { data, error } = await supabase
    .from("ministry_requests")
    .insert({
      request_type: parsed.data.requestType,
      concerns_missing_person: parsed.data.concernsMissingPerson,
      name: parsed.data.name,
      contact_email: parsed.data.contactEmail ?? null,
      contact_phone: parsed.data.contactPhone ?? null,
      details: parsed.data.details ?? null,
    })
    .select("id")
    .single();

  if (error) {
    console.error("ministry_requests insert failed", error);
    return res.status(500).json({ error: "Could not submit your request." });
  }

  await notifyAdmins({
    category: "new_request",
    title: `New ${parsed.data.requestType.replace("_", " ")} request`,
    body: `${parsed.data.name} submitted a request.`,
    linkPath: "/admin/requests",
  });

  if (parsed.data.contactEmail) {
    const { subject, html } = visitorRequestConfirmationEmail({ name: parsed.data.name });
    await sendEmail({ to: parsed.data.contactEmail, subject, html });
  }

  res.status(201).json({ id: data.id });
});

submissionsRouter.post("/rsvps", async (req, res) => {
  const { allowed } = checkRateLimit(`rsvp:${getClientIp(req)}`, RSVP_RATE_LIMIT);
  if (!allowed) return res.status(429).json({ error: "Too many requests. Please try again later." });

  const parsed = createEventRsvpSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid input.", issues: parsed.error.flatten() });
  }

  const supabase = createAnonClient();

  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("id")
    .eq("id", parsed.data.eventId)
    .eq("status", "published")
    .maybeSingle();
  if (eventError || !event) return res.status(404).json({ error: "Event not found." });

  const { error } = await supabase.from("event_rsvps").insert({
    event_id: parsed.data.eventId,
    name: parsed.data.name,
    contact_email: parsed.data.contactEmail ?? null,
    contact_phone: parsed.data.contactPhone ?? null,
    attendee_count: parsed.data.attendeeCount,
  });

  if (error) {
    console.error("event_rsvps insert failed", error);
    return res.status(500).json({ error: "Could not submit your RSVP." });
  }

  await notifyAdmins({
    category: "new_rsvp",
    title: "New event RSVP",
    body: `${parsed.data.name} RSVP'd (${parsed.data.attendeeCount} attending).`,
    linkPath: `/admin/events/${parsed.data.eventId}`,
  });

  res.status(201).json({ ok: true });
});

submissionsRouter.post("/testimonies", async (req, res) => {
  const { allowed } = checkRateLimit(`testimony:${getClientIp(req)}`, TESTIMONY_RATE_LIMIT);
  if (!allowed) return res.status(429).json({ error: "Too many requests. Please try again later." });

  const parsed = createTestimonySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid input.", issues: parsed.error.flatten() });
  }

  const supabase = createAnonClient();
  // status defaults to 'pending' — never shown publicly until moderated (SPEC §12).
  const { error } = await supabase.from("testimonies").insert({
    display_name: parsed.data.isAnonymous ? null : parsed.data.displayName || null,
    is_anonymous: parsed.data.isAnonymous,
    body: parsed.data.body,
    media_id: parsed.data.mediaId ?? null,
  });

  if (error) {
    console.error("testimonies insert failed", error);
    return res.status(500).json({ error: "Could not submit your testimony." });
  }

  await notifyAdmins({
    category: "new_testimony",
    title: "New testimony awaiting review",
    body: "A visitor submitted a testimony for moderation.",
    linkPath: "/admin/testimonies",
  });

  res.status(201).json({ ok: true });
});
