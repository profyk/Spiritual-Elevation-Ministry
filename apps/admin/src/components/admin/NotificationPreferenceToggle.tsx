"use client";

import { useState, useTransition } from "react";
import { updateNotificationPreference } from "@/app/(admin)/admin/(protected)/notifications/actions";
import type { NotificationCategory } from "@sem/shared";

export function NotificationPreferenceToggle({
  category,
  label,
  initialEnabled,
}: {
  category: NotificationCategory;
  label: string;
  initialEnabled: boolean;
}) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [isPending, startTransition] = useTransition();

  return (
    <label className="flex items-center justify-between rounded-md border border-line px-3 py-2 text-sm">
      <span>{label}</span>
      <input
        type="checkbox"
        checked={enabled}
        disabled={isPending}
        onChange={(e) => {
          const next = e.target.checked;
          setEnabled(next);
          startTransition(() => updateNotificationPreference(category, next));
        }}
      />
    </label>
  );
}
