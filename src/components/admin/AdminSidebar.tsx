"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { AdminRole } from "@/lib/permissions";

const NAV_ITEMS: { href: string; label: string; minRole?: AdminRole }[] = [
  { href: "/admin", label: "Dashboard" },
  // Content stays visible to Moderator (read-only "content review",
  // SPEC §21) — the rest below require staff+, matching the RLS/server
  // action boundary in lib/permissions.ts.
  { href: "/admin/content", label: "Content" },
  { href: "/admin/events", label: "Events", minRole: "staff" },
  { href: "/admin/coaching", label: "Coaching", minRole: "staff" },
  { href: "/admin/communication", label: "Communication", minRole: "staff" },
  { href: "/admin/requests", label: "Requests", minRole: "staff" },
  { href: "/admin/testimonies", label: "Testimonies" },
  { href: "/admin/settings", label: "Settings", minRole: "admin" },
  { href: "/admin/users", label: "Users & Roles", minRole: "super_admin" },
  { href: "/admin/audit-log", label: "Audit Log", minRole: "admin" },
];

const ROLE_RANK: Record<AdminRole, number> = {
  moderator: 0,
  staff: 1,
  admin: 2,
  super_admin: 3,
};

export function AdminSidebar({ role }: { role: AdminRole }) {
  const pathname = usePathname();

  return (
    <nav className="w-56 flex-shrink-0 border-r border-neutral-200 bg-white p-4">
      <ul className="space-y-1">
        {NAV_ITEMS.filter((item) => !item.minRole || ROLE_RANK[role] >= ROLE_RANK[item.minRole]).map(
          (item) => {
            const active = pathname === item.href || pathname?.startsWith(`${item.href}/`);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`block rounded-md px-3 py-2 text-sm ${
                    active
                      ? "bg-amber-50 font-medium text-amber-900"
                      : "text-neutral-600 hover:bg-neutral-100"
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            );
          }
        )}
      </ul>
    </nav>
  );
}
