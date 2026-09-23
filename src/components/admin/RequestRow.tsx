"use client";

import { useTransition } from "react";
import { claimRequest, setRequestStatus } from "@/app/(admin)/admin/(protected)/requests/actions";

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

export function RequestRow({ request }: { request: MinistryRequest }) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="rounded bg-neutral-100 px-2 py-0.5 capitalize text-neutral-600">
          {request.request_type.replace("_", " ")}
        </span>
        <span className="rounded bg-neutral-100 px-2 py-0.5 capitalize text-neutral-600">
          {request.status.replace("_", " ")}
        </span>
        {request.concerns_missing_person && (
          <span className="rounded bg-red-100 px-2 py-0.5 text-red-700">Missing person</span>
        )}
        <span className="text-neutral-400">{new Date(request.created_at).toLocaleString()}</span>
      </div>

      <p className="mt-2 text-sm font-medium text-neutral-900">{request.name}</p>
      <p className="text-sm text-neutral-500">
        {[request.contact_email, request.contact_phone].filter(Boolean).join(" · ")}
      </p>
      {request.details && <p className="mt-2 text-sm text-neutral-700">{request.details}</p>}

      <div className="mt-3 flex flex-wrap gap-2">
        {request.status === "new" && (
          <button
            disabled={isPending}
            onClick={() => startTransition(() => claimRequest(request.id))}
            className="rounded-md bg-amber-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-900 disabled:opacity-50"
          >
            Claim
          </button>
        )}
        {request.status === "in_progress" && (
          <button
            disabled={isPending}
            onClick={() => startTransition(() => setRequestStatus(request.id, "resolved"))}
            className="rounded-md bg-green-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-800 disabled:opacity-50"
          >
            Mark resolved
          </button>
        )}
        {request.status !== "archived" && (
          <button
            disabled={isPending}
            onClick={() => startTransition(() => setRequestStatus(request.id, "archived"))}
            className="rounded-md border border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
          >
            Archive
          </button>
        )}
      </div>
    </div>
  );
}
