import { NextResponse } from "next/server";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";

const SIGNED_URL_TTL_SECONDS = 60 * 10;

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // RLS on `media` (0001_init.sql + 0002_storage_and_media_policies.sql)
  // is the actual permission check here: staff see everything, a visitor
  // sees only their own uploads and media attached to their own
  // conversation's messages, and anyone can see media attached to
  // published content/approved testimonies. If this select returns
  // nothing, the caller simply isn't allowed to see it — no separate
  // permission logic to keep in sync with the policies.
  const supabase = await createClient();
  const { data: media, error } = await supabase
    .from("media")
    .select("bucket, storage_path")
    .eq("id", id)
    .maybeSingle();

  if (error || !media) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const serviceClient = createServiceRoleClient();
  const { data: signed, error: signError } = await serviceClient.storage
    .from(media.bucket)
    .createSignedUrl(media.storage_path, SIGNED_URL_TTL_SECONDS);

  if (signError || !signed) {
    console.error("createSignedUrl failed", signError);
    return NextResponse.json({ error: "Could not generate a link." }, { status: 500 });
  }

  return NextResponse.json({ url: signed.signedUrl, expiresIn: SIGNED_URL_TTL_SECONDS });
}
