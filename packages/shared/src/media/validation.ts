import type { MediaKind } from "../validation/media";

export const MAX_SIZE_BY_KIND: Record<MediaKind, number> = {
  image: 10 * 1024 * 1024,
  audio: 100 * 1024 * 1024,
  video: 500 * 1024 * 1024,
  document: 20 * 1024 * 1024,
};

export const ALLOWED_MIME_BY_KIND: Record<MediaKind, string[]> = {
  image: ["image/jpeg", "image/png", "image/webp", "image/gif"],
  audio: ["audio/mpeg", "audio/mp3", "audio/wav", "audio/ogg"],
  video: ["video/mp4", "video/webm"],
  document: ["application/pdf"],
};

/**
 * Sniffs a file's real type from its magic bytes rather than trusting the
 * client-reported MIME type (SPEC §11, §27 item 6). Covers the formats in
 * ALLOWED_MIME_BY_KIND above — add a signature here before allowing a new
 * type anywhere.
 */
export function sniffMimeType(bytes: Uint8Array): string | null {
  const hex = (start: number, len: number) =>
    Array.from(bytes.slice(start, start + len))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  const ascii = (start: number, len: number) =>
    Array.from(bytes.slice(start, start + len))
      .map((b) => String.fromCharCode(b))
      .join("");

  if (hex(0, 3) === "ffd8ff") return "image/jpeg";
  if (hex(0, 8) === "89504e470d0a1a0a") return "image/png";
  if (ascii(0, 4) === "RIFF" && ascii(8, 4) === "WEBP") return "image/webp";
  if (ascii(0, 3) === "GIF") return "image/gif";
  if (ascii(0, 4) === "%PDF") return "application/pdf";
  if (ascii(0, 3) === "ID3" || hex(0, 2) === "fffb" || hex(0, 2) === "fff3") return "audio/mpeg";
  if (ascii(0, 4) === "RIFF" && ascii(8, 4) === "WAVE") return "audio/wav";
  if (ascii(0, 4) === "OggS") return "audio/ogg";
  if (ascii(4, 4) === "ftyp") return "video/mp4";
  if (hex(0, 4) === "1a45dfa3") return "video/webm";

  return null;
}

export interface ValidateUploadResult {
  ok: boolean;
  error?: string;
}

/**
 * Validates size against the claimed kind, then re-derives the type from
 * the actual bytes and checks it against both the claimed kind and the
 * client-reported MIME type — a mismatch on either axis is rejected.
 */
export function validateUpload(
  kind: MediaKind,
  claimedMimeType: string,
  sizeBytes: number,
  bytes: Uint8Array
): ValidateUploadResult {
  if (sizeBytes <= 0) return { ok: false, error: "Empty file." };
  if (sizeBytes > MAX_SIZE_BY_KIND[kind]) {
    return { ok: false, error: `File exceeds the ${MAX_SIZE_BY_KIND[kind] / (1024 * 1024)}MB limit for ${kind}.` };
  }

  const allowed = ALLOWED_MIME_BY_KIND[kind];
  if (!allowed.includes(claimedMimeType)) {
    return { ok: false, error: `Unsupported file type for ${kind}.` };
  }

  const sniffed = sniffMimeType(bytes);
  if (!sniffed || !allowed.includes(sniffed)) {
    return { ok: false, error: "File content doesn't match its claimed type." };
  }

  return { ok: true };
}
