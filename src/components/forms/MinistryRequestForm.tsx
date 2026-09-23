"use client";

import { useState } from "react";
import type { z } from "zod";
import type { requestTypeSchema } from "@/lib/validation/ministry-request";

type RequestType = z.infer<typeof requestTypeSchema>;

export function MinistryRequestForm({
  requestType,
  showMissingPersonOption = false,
}: {
  requestType: RequestType;
  showMissingPersonOption?: boolean;
}) {
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("submitting");
    setErrorMessage(null);

    const form = new FormData(e.currentTarget);
    const payload = {
      requestType,
      concernsMissingPerson: form.get("concernsMissingPerson") === "on",
      name: String(form.get("name") ?? ""),
      contactEmail: String(form.get("contactEmail") ?? "") || undefined,
      contactPhone: String(form.get("contactPhone") ?? "") || undefined,
      details: String(form.get("details") ?? "") || undefined,
    };

    const response = await fetch("/api/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      setStatus("error");
      setErrorMessage(
        response.status === 429
          ? "You've submitted a few requests already — please wait a bit before trying again."
          : "Something went wrong submitting this. Please try again."
      );
      return;
    }

    setStatus("success");
    e.currentTarget.reset();
  }

  if (status === "success") {
    return (
      <div className="rounded-md border border-green-200 bg-green-50 p-4 text-sm text-green-900">
        Thank you — your request has been received. Someone from the ministry will be in touch.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}

      <div>
        <label htmlFor="name" className="mb-1 block text-sm font-medium">
          Name
        </label>
        <input
          id="name"
          name="name"
          required
          maxLength={200}
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="contactEmail" className="mb-1 block text-sm font-medium">
            Email
          </label>
          <input
            id="contactEmail"
            name="contactEmail"
            type="email"
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="contactPhone" className="mb-1 block text-sm font-medium">
            Phone
          </label>
          <input
            id="contactPhone"
            name="contactPhone"
            type="tel"
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>
      </div>
      <p className="text-xs text-neutral-500">Provide at least one: email or phone.</p>

      <div>
        <label htmlFor="details" className="mb-1 block text-sm font-medium">
          Message
        </label>
        <textarea
          id="details"
          name="details"
          rows={4}
          maxLength={5000}
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
        />
      </div>

      {showMissingPersonOption && (
        <label className="flex items-start gap-2 text-sm text-neutral-700">
          <input type="checkbox" name="concernsMissingPerson" className="mt-0.5" />
          This concerns a missing loved one
        </label>
      )}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="rounded-md bg-amber-800 px-4 py-2.5 text-sm font-medium text-white hover:bg-amber-900 disabled:opacity-50"
      >
        {status === "submitting" ? "Sending…" : "Send"}
      </button>
    </form>
  );
}
