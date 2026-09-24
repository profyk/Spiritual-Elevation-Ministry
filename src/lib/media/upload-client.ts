import type { MediaKind, UploadContext } from "@/lib/validation/media";

export async function uploadMedia(
  file: File,
  meta: { kind: MediaKind; context: UploadContext; conversationId?: string }
): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("kind", meta.kind);
  formData.append("context", meta.context);
  if (meta.conversationId) formData.append("conversationId", meta.conversationId);

  const response = await fetch("/api/media", { method: "POST", body: formData });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error ?? "Upload failed.");
  }
  const { id } = await response.json();
  return id as string;
}

export async function getMediaSignedUrl(mediaId: string): Promise<string> {
  const response = await fetch(`/api/media/${mediaId}/signed-url`);
  if (!response.ok) throw new Error("Could not load file.");
  const { url } = await response.json();
  return url as string;
}
