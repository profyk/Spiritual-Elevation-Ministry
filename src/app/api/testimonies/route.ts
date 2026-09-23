import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createTestimonySchema } from "@/lib/validation/testimony";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const RATE_LIMIT = { limit: 5, windowMs: 60 * 60 * 1000 };

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const { allowed } = checkRateLimit(`testimony:${ip}`, RATE_LIMIT);
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

  const parsed = createTestimonySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input.", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  // status defaults to 'pending' — never shown publicly until moderated (SPEC §12).
  const { error } = await supabase.from("testimonies").insert({
    display_name: parsed.data.isAnonymous ? null : parsed.data.displayName || null,
    is_anonymous: parsed.data.isAnonymous,
    body: parsed.data.body,
  });

  if (error) {
    console.error("testimonies insert failed", error);
    return NextResponse.json({ error: "Could not submit your testimony." }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
