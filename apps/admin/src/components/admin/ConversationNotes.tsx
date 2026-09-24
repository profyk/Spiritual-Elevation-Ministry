"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addConversationNote } from "@/app/(admin)/admin/(protected)/communication/actions";

interface Note {
  id: string;
  body: string;
  created_at: string;
  author_id: string;
}

export function ConversationNotes({
  conversationId,
  initialNotes,
}: {
  conversationId: string;
  initialNotes: Note[];
}) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!value.trim()) return;
    const body = value.trim();
    setValue("");
    startTransition(async () => {
      await addConversationNote(conversationId, body);
      router.refresh();
    });
  }

  return (
    <div className="rounded-lg border border-line bg-surface p-4">
      <h2 className="mb-1 text-sm font-medium">Internal notes</h2>
      <p className="mb-3 text-xs text-ink-faint">Never visible to the visitor.</p>

      <div className="mb-3 space-y-2">
        {initialNotes.map((note) => (
          <div key={note.id} className="rounded-md bg-accent-surface p-2 text-xs text-accent-ink">
            <p>{note.body}</p>
            <p className="mt-1 text-accent-ink">{new Date(note.created_at).toLocaleString()}</p>
          </div>
        ))}
        {initialNotes.length === 0 && <p className="text-xs text-ink-faint">No notes yet.</p>}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Add a note…"
          className="flex-1 rounded-md border border-line px-2 py-1.5 text-xs"
        />
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md border border-line px-3 py-1.5 text-xs font-medium hover:bg-surface-2 disabled:opacity-50"
        >
          Add
        </button>
      </form>
    </div>
  );
}
