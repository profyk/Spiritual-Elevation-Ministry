"use client";

import { useState } from "react";
import { Paperclip, Loader2 } from "lucide-react";
import { getMediaSignedUrl } from "@/lib/media/upload-client";

export function MessageAttachment({ mediaId }: { mediaId: string }) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      const url = await getMediaSignedUrl(mediaId);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      // Silently fail — the surrounding message still shows; the user can
      // retry the click.
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="mt-1 flex items-center gap-1 text-xs underline opacity-90 hover:opacity-100 disabled:opacity-50"
    >
      {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Paperclip className="h-3 w-3" />}
      Attachment
    </button>
  );
}
