import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createEventRsvpSchema } from "@/lib/validation/event-rsvp";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const RATE_LIMIT = { limit: 10, windowMs: 60 * 60 * 1000 };

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const { allowed } = checkRateLimit(`rsvp:${ip}`, RATE_LIMIT);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = createEventRsvpSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input.", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("id, status, capacity")
    .eq("id", parsed.data.eventId)
    .eq("status", "published")
    .maybeSingle();

  if (eventError || !event) {
    return NextResponse.json({ error: "Event not found." }, { status: 404 });
  }

  const { error } = await supabase.from("event_rsvps").insert({
    event_id: parsed.data.eventId,
    name: parsed.data.name,
    contact_email: parsed.data.contactEmail ?? null,
    contact_phone: parsed.data.contactPhone ?? null,
    attendee_count: parsed.data.attendeeCount,
  });

  if (error) {
    console.error("event_rsvps insert failed", error);
    return NextResponse.json({ error: "Could not submit your RSVP." }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
