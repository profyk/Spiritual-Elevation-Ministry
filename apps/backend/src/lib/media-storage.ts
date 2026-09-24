import type { SupabaseClient } from "@supabase/supabase-js";
import { createAnonClient, createServiceRoleClient } from "./supabase";

const SIGNED_URL_TTL_SECONDS = 60 * 10;

/**
 * Resolves a media row to a fresh signed URL. Pass the caller's own
 * token-scoped client when there is one (a specific visitor/staff request)
 * so RLS decides whether they're allowed to see it at all — the anon
 * client default only works for media attached to genuinely public
 * content (SPEC §11, §27; policies in 0001/0002_*.sql). Storage RLS is
 * deny-all, so minting the actual URL always goes through the
 * service-role client, after that permission check succeeds.
 */
export async function getMediaSignedUrl(
  mediaId: string | null,
  client: SupabaseClient = createAnonClient()
): Promise<string | null> {
  if (!mediaId) return null;

  const { data: media } = await client
    .from("media")
    .select("bucket, storage_path")
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
  mediaId: string | null,
  client: SupabaseClient = createAnonClient()
): Promise<{ url: string; mimeType: string } | null> {
  if (!mediaId) return null;

  const { data: media } = await client
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
