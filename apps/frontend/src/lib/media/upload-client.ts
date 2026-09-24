import type { MediaKind, UploadContext } from "@sem/shared";
import { createClient } from "@/lib/supabase/client";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3002";

async function getAccessToken(): Promise<string | undefined> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token;
}

export async function uploadMedia(
  file: File,
  meta: { kind: MediaKind; context: UploadContext; conversationId?: string }
): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("kind", meta.kind);
  formData.append("context", meta.context);
  if (meta.conversationId) formData.append("conversationId", meta.conversationId);

  const token = await getAccessToken();
  const response = await fetch(`${API_URL}/media`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: formData,
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error ?? "Upload failed.");
  }
  const { id } = await response.json();
  return id as string;
}

export async function getMediaSignedUrl(mediaId: string): Promise<string> {
  const token = await getAccessToken();
  const response = await fetch(`${API_URL}/media/${mediaId}/signed-url`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  if (!response.ok) throw new Error("Could not load file.");
  const { url } = await response.json();
  return url as string;
}
