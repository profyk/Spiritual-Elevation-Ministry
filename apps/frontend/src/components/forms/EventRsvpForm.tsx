"use client";

import { useState } from "react";
import { API_URL } from "@/lib/api-client";

export function EventRsvpForm({ eventId }: { eventId: string }) {
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("submitting");
    setErrorMessage(null);

    const form = new FormData(e.currentTarget);
    const payload = {
      eventId,
      name: String(form.get("name") ?? ""),
      contactEmail: String(form.get("contactEmail") ?? "") || undefined,
      contactPhone: String(form.get("contactPhone") ?? "") || undefined,
      attendeeCount: Number(form.get("attendeeCount") ?? 1),
    };

    const response = await fetch(`${API_URL}/rsvps`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      setStatus("error");
      setErrorMessage(
        response.status === 429
          ? "Too many RSVPs submitted — please wait a bit before trying again."
          : "Something went wrong. Please try again."
      );
      return;
    }

    setStatus("success");
    e.currentTarget.reset();
  }

  if (status === "success") {
    return (
      <div className="rounded-md border border-green-200 bg-green-50 p-4 text-sm text-green-900">
        You&apos;re RSVP&apos;d. We look forward to seeing you.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}

      <div>
        <label htmlFor="rsvp-name" className="mb-1 block text-sm font-medium">
          Name
        </label>
        <input
          id="rsvp-name"
          name="name"
          required
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="rsvp-email" className="mb-1 block text-sm font-medium">
            Email
          </label>
          <input
            id="rsvp-email"
            name="contactEmail"
            type="email"
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="rsvp-phone" className="mb-1 block text-sm font-medium">
            Phone
          </label>
          <input
            id="rsvp-phone"
            name="contactPhone"
            type="tel"
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>
      </div>
      <p className="text-xs text-neutral-500">Provide at least one: email or phone.</p>

      <div>
        <label htmlFor="rsvp-attendees" className="mb-1 block text-sm font-medium">
          Number attending
        </label>
        <input
          id="rsvp-attendees"
          name="attendeeCount"
          type="number"
          min={1}
          max={20}
          defaultValue={1}
          className="w-24 rounded-md border border-neutral-300 px-3 py-2 text-sm"
        />
      </div>

      <button
        type="submit"
        disabled={status === "submitting"}
        className="rounded-md bg-amber-800 px-4 py-2.5 text-sm font-medium text-white hover:bg-amber-900 disabled:opacity-50"
      >
        {status === "submitting" ? "Submitting…" : "RSVP"}
      </button>
    </form>
  );
}
