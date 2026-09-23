"use client";

import { useState } from "react";

export function TestimonyForm() {
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [isAnonymous, setIsAnonymous] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("submitting");

    const form = new FormData(e.currentTarget);
    const payload = {
      displayName: String(form.get("displayName") ?? "") || undefined,
      isAnonymous,
      body: String(form.get("body") ?? ""),
    };

    const response = await fetch("/api/testimonies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      setStatus("error");
      return;
    }

    setStatus("success");
    e.currentTarget.reset();
  }

  if (status === "success") {
    return (
      <div className="rounded-md border border-green-200 bg-green-50 p-4 text-sm text-green-900">
        Thank you for sharing. Your testimony will appear here once reviewed by the ministry.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {status === "error" && (
        <p className="text-sm text-red-600">Something went wrong. Please try again.</p>
      )}

      <label className="flex items-center gap-2 text-sm text-neutral-700">
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
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
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
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
        />
      </div>

      <button
        type="submit"
        disabled={status === "submitting"}
        className="rounded-md bg-amber-800 px-4 py-2.5 text-sm font-medium text-white hover:bg-amber-900 disabled:opacity-50"
      >
        {status === "submitting" ? "Submitting…" : "Share testimony"}
      </button>
    </form>
  );
}
