"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MessageCircle, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ensureVisitorSession, getStoredConversationId, setStoredConversationId } from "@/lib/chat/session";

interface ChatMessage {
  id: string;
  sender_type: "visitor" | "staff" | "system";
  body: string | null;
  created_at: string;
}

const SERVICE_OPTIONS: { value: string; label: string }[] = [
  { value: "prophetic_ministry", label: "Prophetic Ministry" },
  { value: "healing_deliverance", label: "Healing & Deliverance" },
  { value: "coaching", label: "Coaching" },
  { value: "events", label: "Events" },
  { value: "general", label: "General" },
];

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  // Lazy initializer: only read on the client — the value it produces only
  // ever affects markup inside `{open && ...}`, which starts closed, so
  // there's no SSR/hydration mismatch to worry about here.
  const [conversationId, setConversationId] = useState<string | null>(getStoredConversationId);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingThread, setLoadingThread] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const loadMessages = useCallback(async (id: string) => {
    setLoadingThread(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("messages")
      .select("id, sender_type, body, created_at")
      .eq("conversation_id", id)
      .order("created_at", { ascending: true });
    setMessages(data ?? []);
    setLoadingThread(false);
  }, []);

  useEffect(() => {
    if (!open || !conversationId) return;

    // Fetch-on-mount-then-subscribe: the standard pattern for loading
    // initial data before subscribing to live updates for it.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadMessages(conversationId);

    const supabase = createClient();
    const channel = supabase
      .channel(`conversation:${conversationId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as ChatMessage]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [open, conversationId, loadMessages]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  async function handleStart(payload: {
    serviceContext: string;
    visitorName: string;
    contactEmail?: string;
    contactPhone?: string;
    firstMessage: string;
  }) {
    await ensureVisitorSession();
    const response = await fetch("/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error("Could not start conversation.");
    const { conversationId: id } = await response.json();
    setStoredConversationId(id);
    setConversationId(id);
  }

  async function handleSend(body: string) {
    if (!conversationId) return;
    const response = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversationId, body }),
    });
    if (!response.ok) throw new Error("Could not send message.");
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {open && (
        <div className="mb-3 flex h-[28rem] w-80 flex-col overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-neutral-200 bg-amber-800 px-4 py-3 text-white">
            <span className="text-sm font-medium">Talk to the Ministry</span>
            <button onClick={() => setOpen(false)} aria-label="Close chat" className="hover:opacity-80">
              <X className="h-4 w-4" />
            </button>
          </div>

          {!conversationId ? (
            <IntakeForm onSubmit={handleStart} />
          ) : (
            <>
              <div ref={scrollRef} className="flex-1 space-y-2 overflow-y-auto p-3">
                {loadingThread && <p className="text-xs text-neutral-400">Loading…</p>}
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                      m.sender_type === "visitor"
                        ? "ml-auto bg-amber-800 text-white"
                        : "bg-neutral-100 text-neutral-800"
                    }`}
                  >
                    {m.body}
                  </div>
                ))}
              </div>
              <MessageBox onSend={handleSend} />
            </>
          )}
        </div>
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close chat" : "Open chat"}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-800 text-white shadow-lg hover:bg-amber-900"
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>
    </div>
  );
}

function IntakeForm({
  onSubmit,
}: {
  onSubmit: (payload: {
    serviceContext: string;
    visitorName: string;
    contactEmail?: string;
    contactPhone?: string;
    firstMessage: string;
  }) => Promise<void>;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const form = new FormData(e.currentTarget);
    try {
      await onSubmit({
        serviceContext: String(form.get("serviceContext")),
        visitorName: String(form.get("visitorName") ?? ""),
        contactEmail: String(form.get("contactEmail") ?? "") || undefined,
        contactPhone: String(form.get("contactPhone") ?? "") || undefined,
        firstMessage: String(form.get("firstMessage") ?? ""),
      });
    } catch {
      setError("Something went wrong starting the chat. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex-1 space-y-3 overflow-y-auto p-4 text-sm">
      {error && <p className="text-red-600">{error}</p>}

      <div>
        <label htmlFor="serviceContext" className="mb-1 block font-medium">
          What&apos;s this about?
        </label>
        <select
          id="serviceContext"
          name="serviceContext"
          className="w-full rounded-md border border-neutral-300 px-2 py-1.5"
        >
          {SERVICE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="visitorName" className="mb-1 block font-medium">
          Your name
        </label>
        <input
          id="visitorName"
          name="visitorName"
          required
          className="w-full rounded-md border border-neutral-300 px-2 py-1.5"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label htmlFor="contactEmail" className="mb-1 block font-medium">
            Email
          </label>
          <input
            id="contactEmail"
            name="contactEmail"
            type="email"
            className="w-full rounded-md border border-neutral-300 px-2 py-1.5"
          />
        </div>
        <div>
          <label htmlFor="contactPhone" className="mb-1 block font-medium">
            Phone
          </label>
          <input
            id="contactPhone"
            name="contactPhone"
            type="tel"
            className="w-full rounded-md border border-neutral-300 px-2 py-1.5"
          />
        </div>
      </div>
      <p className="text-xs text-neutral-500">Provide at least one: email or phone.</p>

      <div>
        <label htmlFor="firstMessage" className="mb-1 block font-medium">
          Message
        </label>
        <textarea
          id="firstMessage"
          name="firstMessage"
          required
          rows={3}
          className="w-full rounded-md border border-neutral-300 px-2 py-1.5"
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-md bg-amber-800 px-3 py-2 font-medium text-white hover:bg-amber-900 disabled:opacity-50"
      >
        {submitting ? "Starting…" : "Start chat"}
      </button>
    </form>
  );
}

function MessageBox({ onSend }: { onSend: (body: string) => Promise<void> }) {
  const [value, setValue] = useState("");
  const [sending, setSending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!value.trim()) return;
    setSending(true);
    try {
      await onSend(value.trim());
      setValue("");
    } finally {
      setSending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 border-t border-neutral-200 p-3">
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Type a message…"
        className="flex-1 rounded-md border border-neutral-300 px-3 py-1.5 text-sm"
      />
      <button
        type="submit"
        disabled={sending}
        className="rounded-md bg-amber-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-900 disabled:opacity-50"
      >
        Send
      </button>
    </form>
  );
}
