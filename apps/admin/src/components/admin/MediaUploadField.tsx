"use client";

import { useState } from "react";
import { Loader2, X } from "lucide-react";
import { uploadMedia, getMediaSignedUrl } from "@/lib/media/upload-client";
import type { MediaKind } from "@sem/shared";

const ACCEPT_BY_KIND: Record<MediaKind, string> = {
  image: "image/jpeg,image/png,image/webp,image/gif",
  audio: "audio/mpeg,audio/wav,audio/ogg",
  video: "video/mp4,video/webm",
  document: "application/pdf",
};

export function MediaUploadField({
  name,
  label,
  kind,
  initialMediaId,
}: {
  name: string;
  label: string;
  kind: MediaKind;
  initialMediaId?: string | null;
}) {
  const [mediaId, setMediaId] = useState<string | null>(initialMediaId ?? null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const id = await uploadMedia(file, { kind, context: "admin" });
      setMediaId(id);
      if (kind === "image") {
        setPreviewUrl(await getMediaSignedUrl(id));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  return (
    <div>
      <label className="mb-1 block text-sm font-medium">{label}</label>
      <input type="hidden" name={name} value={mediaId ?? ""} />

      {previewUrl && (
        // eslint-disable-next-line @next/next/no-img-element -- short-lived signed URL, not an optimizable remote asset
        <img src={previewUrl} alt="" className="mb-2 h-24 w-24 rounded-md object-cover" />
      )}

      {mediaId && !previewUrl && (
        <p className="mb-2 text-xs text-neutral-500">File attached.</p>
      )}

      <div className="flex items-center gap-2">
        <input
          type="file"
          accept={ACCEPT_BY_KIND[kind]}
          onChange={handleChange}
          disabled={uploading}
          className="text-sm"
        />
        {uploading && <Loader2 className="h-4 w-4 animate-spin text-neutral-400" />}
        {mediaId && !uploading && (
          <button
            type="button"
            onClick={() => {
              setMediaId(null);
              setPreviewUrl(null);
            }}
            className="text-neutral-400 hover:text-neutral-700"
            aria-label="Remove file"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
