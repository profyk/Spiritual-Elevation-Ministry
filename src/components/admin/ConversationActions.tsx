"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  claimConversation,
  transferConversation,
  setConversationStatus,
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
}: {
  conversationId: string;
  status: string;
  assignedTo: string | null;
  staffOptions: StaffOption[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

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
          className="rounded-md bg-amber-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-900 disabled:opacity-50"
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
        className="rounded-md border border-neutral-300 px-2 py-1.5 text-xs"
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
          className="rounded-md border border-neutral-300 px-3 py-1.5 text-xs hover:bg-neutral-50 disabled:opacity-50"
        >
          Mark pending follow-up
        </button>
      )}

      {status !== "closed" && (
        <button
          disabled={isPending}
          onClick={() => run(() => setConversationStatus(conversationId, "closed"))}
          className="rounded-md border border-neutral-300 px-3 py-1.5 text-xs hover:bg-neutral-50 disabled:opacity-50"
        >
          Close
        </button>
      )}

      {status === "closed" && (
        <button
          disabled={isPending}
          onClick={() => run(() => setConversationStatus(conversationId, "open"))}
          className="rounded-md border border-neutral-300 px-3 py-1.5 text-xs hover:bg-neutral-50 disabled:opacity-50"
        >
          Reopen
        </button>
      )}

      {status !== "archived" && (
        <button
          disabled={isPending}
          onClick={() => run(() => setConversationStatus(conversationId, "archived"))}
          className="rounded-md border border-neutral-300 px-3 py-1.5 text-xs hover:bg-neutral-50 disabled:opacity-50"
        >
          Archive
        </button>
      )}
    </div>
  );
}
