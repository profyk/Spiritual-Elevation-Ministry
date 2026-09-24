"use client";

import { useState, useTransition } from "react";
import { updateLegalPage } from "@/app/(admin)/admin/(protected)/settings/actions";

export function LegalPageField({
  pageType,
  label,
  initialBody,
}: {
  pageType: "privacy_policy" | "terms_of_use";
  label: string;
  initialBody: string;
}) {
  const [body, setBody] = useState(initialBody);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    startTransition(async () => {
      await updateLegalPage(pageType, body);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  }

  return (
    <div>
      <label className="mb-1 block text-sm font-medium">{label}</label>
      <textarea
        rows={8}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        className="w-full rounded-md border border-line px-3 py-2 text-sm"
      />
      <div className="mt-1 flex items-center gap-2">
        <button
          type="button"
          disabled={isPending}
          onClick={handleSave}
          className="rounded-md bg-solid px-3 py-1.5 text-xs font-medium text-on-solid disabled:opacity-50"
        >
          {isPending ? "Saving…" : "Save"}
        </button>
        {saved && <span className="text-xs text-success-ink">Saved</span>}
      </div>
    </div>
  );
}
