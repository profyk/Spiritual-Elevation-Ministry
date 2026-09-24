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
    <div className="rounded-lg border border-neutral-200 bg-white p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-neutral-900">
            {testimony.is_anonymous || !testimony.display_name ? "Anonymous" : testimony.display_name}
            <span className="ml-2 rounded bg-neutral-100 px-2 py-0.5 text-xs capitalize text-neutral-500">
              {testimony.status}
            </span>
            {testimony.is_featured && (
              <span className="ml-2 rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-800">
                Featured
              </span>
            )}
          </p>
          <p className="mt-1 text-sm text-neutral-700">{testimony.body}</p>
          <p className="mt-1 text-xs text-neutral-400">
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
              className="rounded-md bg-green-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-800 disabled:opacity-50"
            >
              Approve
            </button>
            <button
              disabled={isPending}
              onClick={() => setShowReject((v) => !v)}
              className="rounded-md border border-red-300 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50"
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
              className="rounded-md border border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
            >
              {testimony.is_featured ? "Unfeature" : "Feature"}
            </button>
            <button
              disabled={isPending}
              onClick={() => startTransition(() => archiveTestimony(testimony.id))}
              className="rounded-md border border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
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
            className="flex-1 rounded-md border border-neutral-300 px-3 py-1.5 text-xs"
          />
          <button
            disabled={isPending}
            onClick={() =>
              startTransition(async () => {
                await moderateTestimony(testimony.id, "rejected", reason);
                setShowReject(false);
              })
            }
            className="rounded-md bg-red-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-800 disabled:opacity-50"
          >
            Confirm reject
          </button>
        </div>
      )}
    </div>
  );
}
