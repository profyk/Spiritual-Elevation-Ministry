"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Paperclip, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { sendStaffMessage } from "@/app/(admin)/admin/(protected)/communication/actions";
import { uploadMedia } from "@/lib/media/upload-client";
import { kindFromMimeType } from "@sem/shared";
import { MessageAttachment } from "@/components/chat/MessageAttachment";

interface ChatMessage {
  id: string;
  sender_type: "visitor" | "staff" | "system";
  body: string | null;
  attachment_media_id: string | null;
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
  const [uploading, setUploading] = useState(false);
  const [pendingAttachment, setPendingAttachment] = useState<{ id: string; name: string } | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
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

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    const kind = kindFromMimeType(file.type);
    if (!kind) {
      setUploadError("That file type isn't supported.");
      return;
    }

    setUploadError(null);
    setUploading(true);
    try {
      const id = await uploadMedia(file, { kind, context: "chat", conversationId });
      setPendingAttachment({ id, name: file.name });
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!value.trim() && !pendingAttachment) return;
    const body = value.trim();
    const attachmentMediaId = pendingAttachment?.id;
    setValue("");
    setPendingAttachment(null);
    startTransition(() => sendStaffMessage(conversationId, body, attachmentMediaId));
  }

  return (
    <div className="flex h-[32rem] flex-col rounded-lg border border-line bg-surface">
      <div
        ref={scrollRef}
        role="log"
        aria-live="polite"
        aria-label="Conversation messages"
        className="flex-1 space-y-2 overflow-y-auto p-4"
      >
        {messages.map((m) => (
          <div
            key={m.id}
            className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${
              m.sender_type === "staff"
                ? "ml-auto bg-accent text-white"
                : m.sender_type === "system"
                  ? "mx-auto bg-surface-2 text-ink-faint"
                  : "bg-surface-3 text-ink"
            }`}
          >
            {m.body}
            {m.attachment_media_id && <MessageAttachment mediaId={m.attachment_media_id} />}
          </div>
        ))}
        {messages.length === 0 && (
          <p className="text-sm text-ink-faint">No messages yet.</p>
        )}
      </div>
      <form onSubmit={handleSubmit} className="border-t border-line p-3">
        {uploadError && <p className="mb-1 text-xs text-danger-ink">{uploadError}</p>}
        {pendingAttachment && (
          <p className="mb-1 flex items-center gap-1 text-xs text-ink-faint">
            <Paperclip className="h-3 w-3" /> {pendingAttachment.name}
            <button
              type="button"
              onClick={() => setPendingAttachment(null)}
              className="ml-1 text-ink-faint hover:text-ink-muted"
            >
              remove
            </button>
          </p>
        )}
        <div className="flex gap-2">
          <label className="flex cursor-pointer items-center justify-center rounded-md border border-line px-2 text-ink-faint hover:bg-surface-2">
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
            <input type="file" onChange={handleFileChange} disabled={uploading} className="hidden" />
          </label>
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Reply…"
            className="flex-1 rounded-md border border-line px-3 py-1.5 text-sm"
          />
          <button
            type="submit"
            disabled={isPending || uploading}
            className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
