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
        className="relative rounded-md p-2 text-neutral-600 hover:bg-neutral-100"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-medium text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-10 mt-2 w-80 rounded-lg border border-neutral-200 bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-neutral-100 px-3 py-2">
            <span className="text-sm font-medium">Notifications</span>
            {unreadCount > 0 && (
              <button
                onClick={() => {
                  setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
                  markAllNotificationsRead();
                }}
                className="text-xs text-amber-800 hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 && (
              <p className="px-3 py-4 text-center text-xs text-neutral-400">No notifications.</p>
            )}
            {notifications.slice(0, 20).map((n) => (
              <Link
                key={n.id}
                href={n.link_url ?? "/admin"}
                onClick={() => setOpen(false)}
                className={`block border-b border-neutral-50 px-3 py-2 text-sm hover:bg-neutral-50 ${
                  n.is_read ? "text-neutral-500" : "font-medium text-neutral-900"
                }`}
              >
                {n.title}
                <p className="text-xs font-normal text-neutral-400">
                  {new Date(n.created_at).toLocaleString()}
                </p>
              </Link>
            ))}
          </div>
          <Link
            href="/admin/notifications/preferences"
            onClick={() => setOpen(false)}
            className="block border-t border-neutral-100 px-3 py-2 text-center text-xs text-neutral-500 hover:bg-neutral-50"
          >
            Notification preferences
          </Link>
        </div>
      )}
    </div>
  );
}
