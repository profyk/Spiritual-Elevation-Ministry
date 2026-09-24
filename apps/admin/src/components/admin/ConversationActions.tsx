"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  claimConversation,
  transferConversation,
  setConversationStatus,
  deleteConversation,
} from "@/app/(admin)/admin/(protected)/communication/actions";

interface StaffOption {
  id: string;
  full_name: string;
}

export function ConversationActions({
  conversationId,
  status,
  assignedTo,
  staffOptions,
  canDelete,
}: {
  conversationId: string;
  status: string;
  assignedTo: string | null;
  staffOptions: StaffOption[];
  canDelete: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  function run(fn: () => Promise<void>) {
    startTransition(async () => {
      await fn();
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {!assignedTo && (
        <button
          disabled={isPending}
          onClick={() => run(() => claimConversation(conversationId))}
          className="rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-white hover:bg-accent-hover disabled:opacity-50"
        >
          Claim
        </button>
      )}

      <select
        disabled={isPending}
        defaultValue=""
        onChange={(e) => {
          if (e.target.value) run(() => transferConversation(conversationId, e.target.value));
        }}
        className="rounded-md border border-line px-2 py-1.5 text-xs"
      >
        <option value="">Transfer to…</option>
        {staffOptions.map((s) => (
          <option key={s.id} value={s.id}>
            {s.full_name}
          </option>
        ))}
      </select>

      {status !== "pending_visitor" && (
        <button
          disabled={isPending}
          onClick={() => run(() => setConversationStatus(conversationId, "pending_visitor"))}
          className="rounded-md border border-line px-3 py-1.5 text-xs hover:bg-surface-2 disabled:opacity-50"
        >
          Mark pending follow-up
        </button>
      )}

      {status !== "closed" && (
        <button
          disabled={isPending}
          onClick={() => run(() => setConversationStatus(conversationId, "closed"))}
          className="rounded-md border border-line px-3 py-1.5 text-xs hover:bg-surface-2 disabled:opacity-50"
        >
          Close
        </button>
      )}

      {status === "closed" && (
        <button
          disabled={isPending}
          onClick={() => run(() => setConversationStatus(conversationId, "open"))}
          className="rounded-md border border-line px-3 py-1.5 text-xs hover:bg-surface-2 disabled:opacity-50"
        >
          Reopen
        </button>
      )}

      {status !== "archived" && (
        <button
          disabled={isPending}
          onClick={() => run(() => setConversationStatus(conversationId, "archived"))}
          className="rounded-md border border-line px-3 py-1.5 text-xs hover:bg-surface-2 disabled:opacity-50"
        >
          Archive
        </button>
      )}

      {canDelete && status === "archived" && !confirmingDelete && (
        <button
          disabled={isPending}
          onClick={() => setConfirmingDelete(true)}
          className="rounded-md border border-danger-line px-3 py-1.5 text-xs font-medium text-danger-ink hover:bg-danger-surface"
        >
          Delete permanently
        </button>
      )}

      {confirmingDelete && (
        <span className="flex items-center gap-2 rounded-md border border-danger-line bg-danger-surface px-3 py-1.5">
          <span className="text-xs text-danger-ink">Permanently delete? This cannot be undone.</span>
          <button
            disabled={isPending}
            onClick={() =>
              startTransition(async () => {
                await deleteConversation(conversationId);
                router.push("/admin/communication");
              })
            }
            className="rounded-md bg-danger px-2 py-1 text-xs font-medium text-white hover:bg-danger-hover disabled:opacity-50"
          >
            Confirm
          </button>
          <button
            disabled={isPending}
            onClick={() => setConfirmingDelete(false)}
            className="rounded-md border border-line px-2 py-1 text-xs hover:bg-surface-2"
          >
            Cancel
          </button>
        </span>
      )}
    </div>
  );
}
