"use client";

import { useState, useTransition } from "react";
import { moderateTestimony, toggleTestimonyFeatured, archiveTestimony } from "@/app/(admin)/admin/(protected)/testimonies/actions";

interface Testimony {
  id: string;
  display_name: string | null;
  is_anonymous: boolean;
  body: string;
  status: string;
  is_featured: boolean;
  created_at: string;
}

export function TestimonyRow({ testimony }: { testimony: Testimony }) {
  const [showReject, setShowReject] = useState(false);
  const [reason, setReason] = useState("");
  const [isPending, startTransition] = useTransition();

  return (
    <div className="rounded-lg border border-line bg-surface p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-ink">
            {testimony.is_anonymous || !testimony.display_name ? "Anonymous" : testimony.display_name}
            <span className="ml-2 rounded bg-surface-3 px-2 py-0.5 text-xs capitalize text-ink-faint">
              {testimony.status}
            </span>
            {testimony.is_featured && (
              <span className="ml-2 rounded bg-accent-surface px-2 py-0.5 text-xs text-accent-ink">
                Featured
              </span>
            )}
          </p>
          <p className="mt-1 text-sm text-ink-muted">{testimony.body}</p>
          <p className="mt-1 text-xs text-ink-faint">
            {new Date(testimony.created_at).toLocaleString()}
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {testimony.status === "pending" && (
          <>
            <button
              disabled={isPending}
              onClick={() => startTransition(() => moderateTestimony(testimony.id, "approved"))}
              className="rounded-md bg-success px-3 py-1.5 text-xs font-medium text-white hover:bg-success-hover disabled:opacity-50"
            >
              Approve
            </button>
            <button
              disabled={isPending}
              onClick={() => setShowReject((v) => !v)}
              className="rounded-md border border-danger-line px-3 py-1.5 text-xs font-medium text-danger-ink hover:bg-danger-surface"
            >
              Reject
            </button>
          </>
        )}
        {testimony.status === "approved" && (
          <>
            <button
              disabled={isPending}
              onClick={() =>
                startTransition(() => toggleTestimonyFeatured(testimony.id, !testimony.is_featured))
              }
              className="rounded-md border border-line px-3 py-1.5 text-xs font-medium text-ink-muted hover:bg-surface-2"
            >
              {testimony.is_featured ? "Unfeature" : "Feature"}
            </button>
            <button
              disabled={isPending}
              onClick={() => startTransition(() => archiveTestimony(testimony.id))}
              className="rounded-md border border-line px-3 py-1.5 text-xs font-medium text-ink-muted hover:bg-surface-2"
            >
              Archive
            </button>
          </>
        )}
      </div>

      {showReject && (
        <div className="mt-3 flex gap-2">
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Internal reason (not shown to submitter)"
            className="flex-1 rounded-md border border-line px-3 py-1.5 text-xs"
          />
          <button
            disabled={isPending}
            onClick={() =>
              startTransition(async () => {
                await moderateTestimony(testimony.id, "rejected", reason);
                setShowReject(false);
              })
            }
            className="rounded-md bg-danger px-3 py-1.5 text-xs font-medium text-white hover:bg-danger-hover disabled:opacity-50"
          >
            Confirm reject
          </button>
        </div>
      )}
    </div>
  );
}
