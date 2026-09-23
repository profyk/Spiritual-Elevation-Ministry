"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { sendStaffMessage } from "@/app/(admin)/admin/(protected)/communication/actions";

interface ChatMessage {
  id: string;
  sender_type: "visitor" | "staff" | "system";
  body: string | null;
  created_at: string;
}

export function StaffChatThread({
  conversationId,
  initialMessages,
}: {
  conversationId: string;
  initialMessages: ChatMessage[];
}) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [value, setValue] = useState("");
  const [isPending, startTransition] = useTransition();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`admin-conversation:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as ChatMessage]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!value.trim()) return;
    const body = value.trim();
    setValue("");
    startTransition(() => sendStaffMessage(conversationId, body));
  }

  return (
    <div className="flex h-[32rem] flex-col rounded-lg border border-neutral-200 bg-white">
      <div ref={scrollRef} className="flex-1 space-y-2 overflow-y-auto p-4">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${
              m.sender_type === "staff"
                ? "ml-auto bg-amber-800 text-white"
                : m.sender_type === "system"
                  ? "mx-auto bg-neutral-50 text-neutral-500"
                  : "bg-neutral-100 text-neutral-800"
            }`}
          >
            {m.body}
          </div>
        ))}
        {messages.length === 0 && (
          <p className="text-sm text-neutral-400">No messages yet.</p>
        )}
      </div>
      <form onSubmit={handleSubmit} className="flex gap-2 border-t border-neutral-200 p-3">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Reply…"
          className="flex-1 rounded-md border border-neutral-300 px-3 py-1.5 text-sm"
        />
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-amber-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-900 disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
}
