"use client";

import { useState } from "react";
import { API_URL } from "@/lib/api-client";
import { ensureVisitorSession } from "@/lib/chat/session";
import { uploadMedia } from "@/lib/media/upload-client";

const MAX_PHOTO_BYTES = 10 * 1024 * 1024;

export function TestimonyForm() {
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [photo, setPhoto] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    if (file && file.size > MAX_PHOTO_BYTES) {
      setError("Photo must be under 10MB.");
      e.target.value = "";
      setPhoto(null);
      return;
    }
    setError(null);
    setPhoto(file);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setStatus("submitting");

    try {
      let mediaId: string | undefined;
      if (photo) {
        await ensureVisitorSession();
        mediaId = await uploadMedia(photo, { kind: "image", context: "testimony" });
      }

      const form = new FormData(e.currentTarget);
      const payload = {
        displayName: String(form.get("displayName") ?? "") || undefined,
        isAnonymous,
        body: String(form.get("body") ?? ""),
        mediaId,
      };

      const response = await fetch(`${API_URL}/testimonies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        setStatus("error");
        return;
      }

      setStatus("success");
      setPhoto(null);
      e.currentTarget.reset();
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="rounded-md border border-success-line bg-success-surface p-4 text-sm text-success-ink">
        Thank you for sharing. Your testimony will appear here once reviewed by the ministry.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {status === "error" && (
        <p className="text-sm text-danger-ink">Something went wrong. Please try again.</p>
      )}
      {error && <p className="text-sm text-danger-ink">{error}</p>}

      <label className="flex items-center gap-2 text-sm text-ink-muted">
        <input
          type="checkbox"
          checked={isAnonymous}
          onChange={(e) => setIsAnonymous(e.target.checked)}
        />
        Post anonymously
      </label>

      {!isAnonymous && (
        <div>
          <label htmlFor="displayName" className="mb-1 block text-sm font-medium">
            Your name
          </label>
          <input
            id="displayName"
            name="displayName"
            maxLength={200}
            className="w-full rounded-md border border-line px-3 py-2 text-sm"
          />
        </div>
      )}

      <div>
        <label htmlFor="body" className="mb-1 block text-sm font-medium">
          Your testimony
        </label>
        <textarea
          id="body"
          name="body"
          required
          minLength={10}
          maxLength={5000}
          rows={5}
          className="w-full rounded-md border border-line px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label htmlFor="photo" className="mb-1 block text-sm font-medium">
          Photo <span className="font-normal text-ink-faint">(optional)</span>
        </label>
        <input
          id="photo"
          type="file"
          accept="image/*"
          onChange={handlePhotoChange}
          className="w-full text-sm text-ink-muted file:mr-3 file:rounded-md file:border-0 file:bg-surface-3 file:px-3 file:py-2 file:text-sm file:font-medium hover:file:bg-surface-3"
        />
      </div>

      <button
        type="submit"
        disabled={status === "submitting"}
        className="rounded-md bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50"
      >
        {status === "submitting" ? "Submitting…" : "Share testimony"}
      </button>
    </form>
  );
}
