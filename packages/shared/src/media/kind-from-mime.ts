import type { MediaKind } from "../validation/media";

export function kindFromMimeType(mimeType: string): MediaKind | null {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("audio/")) return "audio";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType === "application/pdf") return "document";
  return null;
}
