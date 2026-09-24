"use client";

import { useState, useTransition } from "react";
import { claimRequest, setRequestStatus, deleteRequest } from "@/app/(admin)/admin/(protected)/requests/actions";

interface MinistryRequest {
  id: string;
  request_type: string;
  concerns_missing_person: boolean;
  name: string;
  contact_email: string | null;
  contact_phone: string | null;
  details: string | null;
  status: string;
  assigned_to: string | null;
  created_at: string;
}

export function RequestRow({ request, canDelete }: { request: MinistryRequest; canDelete: boolean }) {
  const [isPending, startTransition] = useTransition();
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  return (
    <div className="rounded-lg border border-line bg-surface p-4">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="rounded bg-surface-3 px-2 py-0.5 capitalize text-ink-muted">
          {request.request_type.replace("_", " ")}
        </span>
        <span className="rounded bg-surface-3 px-2 py-0.5 capitalize text-ink-muted">
          {request.status.replace("_", " ")}
        </span>
        {request.concerns_missing_person && (
          <span className="rounded bg-danger-surface px-2 py-0.5 text-danger-ink">Missing person</span>
        )}
        <span className="text-ink-faint">{new Date(request.created_at).toLocaleString()}</span>
      </div>

      <p className="mt-2 text-sm font-medium text-ink">{request.name}</p>
      <p className="text-sm text-ink-faint">
        {[request.contact_email, request.contact_phone].filter(Boolean).join(" · ")}
      </p>
      {request.details && <p className="mt-2 text-sm text-ink-muted">{request.details}</p>}

      <div className="mt-3 flex flex-wrap gap-2">
        {request.status === "new" && (
          <button
            disabled={isPending}
            onClick={() => startTransition(() => claimRequest(request.id))}
            className="rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-white hover:bg-accent-hover disabled:opacity-50"
          >
            Claim
          </button>
        )}
        {request.status === "in_progress" && (
          <button
            disabled={isPending}
            onClick={() => startTransition(() => setRequestStatus(request.id, "resolved"))}
            className="rounded-md bg-success px-3 py-1.5 text-xs font-medium text-white hover:bg-success-hover disabled:opacity-50"
          >
            Mark resolved
          </button>
        )}
        {request.status !== "archived" && (
          <button
            disabled={isPending}
            onClick={() => startTransition(() => setRequestStatus(request.id, "archived"))}
            className="rounded-md border border-line px-3 py-1.5 text-xs font-medium text-ink-muted hover:bg-surface-2"
          >
            Archive
          </button>
        )}
        {canDelete && request.status === "archived" && !confirmingDelete && (
          <button
            disabled={isPending}
            onClick={() => setConfirmingDelete(true)}
            className="rounded-md border border-danger-line px-3 py-1.5 text-xs font-medium text-danger-ink hover:bg-danger-surface"
          >
            Delete permanently
          </button>
        )}
      </div>

      {confirmingDelete && (
        <div className="mt-3 flex items-center gap-2 rounded-md border border-danger-line bg-danger-surface p-3">
          <p className="flex-1 text-xs text-danger-ink">
            Permanently delete this request? This cannot be undone.
          </p>
          <button
            disabled={isPending}
            onClick={() => startTransition(() => deleteRequest(request.id))}
            className="rounded-md bg-danger px-3 py-1.5 text-xs font-medium text-white hover:bg-danger-hover disabled:opacity-50"
          >
            Confirm delete
          </button>
          <button
            disabled={isPending}
            onClick={() => setConfirmingDelete(false)}
            className="rounded-md border border-line px-3 py-1.5 text-xs font-medium text-ink-muted hover:bg-surface-2"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
