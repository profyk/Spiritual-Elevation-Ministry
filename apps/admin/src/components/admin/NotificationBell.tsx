"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { markAllNotificationsRead } from "@/app/(admin)/admin/(protected)/notifications/actions";

interface NotificationRow {
  id: string;
  title: string;
  body: string | null;
  link_url: string | null;
  is_read: boolean;
  created_at: string;
}

export function NotificationBell({
  adminId,
  initialNotifications,
}: {
  adminId: string;
  initialNotifications: NotificationRow[];
}) {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`admin-notifications:${adminId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `recipient_admin_id=eq.${adminId}`,
        },
        (payload) => {
          setNotifications((prev) => [payload.new as NotificationRow, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [adminId]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
        className="relative rounded-md p-2 text-ink-muted hover:bg-surface-3"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-medium text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-10 mt-2 w-80 rounded-lg border border-line bg-surface shadow-lg">
          <div className="flex items-center justify-between border-b border-line-faint px-3 py-2">
            <span className="text-sm font-medium">Notifications</span>
            {unreadCount > 0 && (
              <button
                onClick={() => {
                  setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
                  markAllNotificationsRead();
                }}
                className="text-xs text-accent-ink hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 && (
              <p className="px-3 py-4 text-center text-xs text-ink-faint">No notifications.</p>
            )}
            {notifications.slice(0, 20).map((n) => (
              <Link
                key={n.id}
                href={n.link_url ?? "/admin"}
                onClick={() => setOpen(false)}
                className={`block border-b border-line-faint px-3 py-2 text-sm hover:bg-surface-2 ${
                  n.is_read ? "text-ink-faint" : "font-medium text-ink"
                }`}
              >
                {n.title}
                <p className="text-xs font-normal text-ink-faint">
                  {new Date(n.created_at).toLocaleString()}
                </p>
              </Link>
            ))}
          </div>
          <Link
            href="/admin/notifications/preferences"
            onClick={() => setOpen(false)}
            className="block border-t border-line-faint px-3 py-2 text-center text-xs text-ink-faint hover:bg-surface-2"
          >
            Notification preferences
          </Link>
        </div>
      )}
    </div>
  );
}
