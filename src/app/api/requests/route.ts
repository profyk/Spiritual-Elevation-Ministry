import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createMinistryRequestSchema } from "@/lib/validation/ministry-request";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

// SPEC §30: form submissions rate-limited per IP.
const RATE_LIMIT = { limit: 10, windowMs: 60 * 60 * 1000 };

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const { allowed } = checkRateLimit(`ministry_request:${ip}`, RATE_LIMIT);
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

  const parsed = createMinistryRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input.", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const supabase = await createClient();
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
    return NextResponse.json({ error: "Could not submit your request." }, { status: 500 });
  }

  // Admin email/in-app notification (SPEC §19) is wired up alongside the
  // notification system in Phase 5 — not yet implemented here.

  return NextResponse.json({ id: data.id }, { status: 201 });
}
