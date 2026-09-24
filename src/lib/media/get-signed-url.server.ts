import { createClient, createServiceRoleClient } from "@/lib/supabase/server";

const SIGNED_URL_TTL_SECONDS = 60 * 10;

/**
 * Server-side equivalent of GET /api/media/[id]/signed-url, for rendering
 * a media reference (cover image, sermon audio/video) directly in a
 * server component instead of round-tripping through the API route.
 * Same RLS-gated permission check — see that route for why it's safe to
 * mint from the service-role client afterward.
 */
export async function getMediaSignedUrl(mediaId: string | null): Promise<string | null> {
  if (!mediaId) return null;

  const supabase = await createClient();
  const { data: media } = await supabase
    .from("media")
    .select("bucket, storage_path, mime_type")
    .eq("id", mediaId)
    .maybeSingle();

  if (!media) return null;

  const serviceClient = createServiceRoleClient();
  const { data: signed } = await serviceClient.storage
    .from(media.bucket)
    .createSignedUrl(media.storage_path, SIGNED_URL_TTL_SECONDS);

  return signed?.signedUrl ?? null;
}

export async function getMediaWithSignedUrl(
  mediaId: string | null
): Promise<{ url: string; mimeType: string } | null> {
  if (!mediaId) return null;

  const supabase = await createClient();
  const { data: media } = await supabase
    .from("media")
    .select("bucket, storage_path, mime_type")
    .eq("id", mediaId)
    .maybeSingle();

  if (!media) return null;

  const serviceClient = createServiceRoleClient();
  const { data: signed } = await serviceClient.storage
    .from(media.bucket)
    .createSignedUrl(media.storage_path, SIGNED_URL_TTL_SECONDS);

  if (!signed) return null;
  return { url: signed.signedUrl, mimeType: media.mime_type };
}
