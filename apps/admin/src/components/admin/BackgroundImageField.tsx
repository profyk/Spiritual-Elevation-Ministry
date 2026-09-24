"use client";

import { useState, useTransition } from "react";
import { Loader2, X } from "lucide-react";
import { uploadMedia, getMediaSignedUrl } from "@/lib/media/upload-client";
import { updateSetting } from "@/app/(admin)/admin/(protected)/settings/actions";

/**
 * Site-wide background image (frontend + admin both render it, low-opacity
 * and fixed) — stored as a media id in website_settings under
 * 'site_background_media_id'. Defaults to the ministry logo when unset;
 * this is the "change it" half of that pipeline.
 */
export function BackgroundImageField({
  initialMediaId,
  initialPreviewUrl,
}: {
  initialMediaId: string;
  initialPreviewUrl: string | null;
}) {
  const [mediaId, setMediaId] = useState(initialMediaId);
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialPreviewUrl);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const id = await uploadMedia(file, { kind: "image", context: "admin" });
      setPreviewUrl(await getMediaSignedUrl(id));
      setMediaId(id);
      startTransition(() => updateSetting("site_background_media_id", id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  function handleReset() {
    setMediaId("");
    setPreviewUrl(null);
    startTransition(() => updateSetting("site_background_media_id", ""));
  }

  return (
    <div>
      <label className="mb-1 block text-sm font-medium">Background image</label>
      <p className="mb-2 text-xs text-ink-faint">
        Shown as a subtle full-page background on the public site and this dashboard. Defaults to
        the ministry logo when nothing is set here.
      </p>

      {previewUrl && (
        // eslint-disable-next-line @next/next/no-img-element -- short-lived signed URL, not an optimizable remote asset
        <img src={previewUrl} alt="" className="mb-2 h-24 w-40 rounded-md object-cover" />
      )}
      {mediaId && !previewUrl && <p className="mb-2 text-xs text-ink-faint">Custom image set.</p>}
      {!mediaId && <p className="mb-2 text-xs text-ink-faint">Using the default logo background.</p>}

      <div className="flex items-center gap-2">
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleChange}
          disabled={uploading || isPending}
          className="text-sm"
        />
        {(uploading || isPending) && <Loader2 className="h-4 w-4 animate-spin text-ink-faint" />}
        {mediaId && !uploading && (
          <button
            type="button"
            onClick={handleReset}
            className="text-ink-faint hover:text-ink"
            aria-label="Reset to default logo background"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {error && <p className="mt-1 text-xs text-danger-ink">{error}</p>}
    </div>
  );
}
