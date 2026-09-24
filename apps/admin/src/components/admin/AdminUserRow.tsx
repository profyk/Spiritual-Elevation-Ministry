"use client";

import { useTransition } from "react";
import { setAdminRole, setAdminActive } from "@/app/(admin)/admin/(protected)/users/actions";
import type { AdminRole } from "@sem/shared";

interface AdminUserRowData {
  id: string;
  full_name: string;
  role: AdminRole;
  is_active: boolean;
}

export function AdminUserRow({ user, isSelf }: { user: AdminUserRowData; isSelf: boolean }) {
  const [isPending, startTransition] = useTransition();

  return (
    <tr className="border-b border-line-faint last:border-0">
      <td className="px-4 py-2">
        {user.full_name} {isSelf && <span className="text-xs text-ink-faint">(you)</span>}
      </td>
      <td className="px-4 py-2">
        <select
          value={user.role}
          disabled={isPending || isSelf}
          onChange={(e) =>
            startTransition(() => setAdminRole(user.id, e.target.value as AdminRole))
          }
          className="rounded-md border border-line px-2 py-1 text-xs disabled:opacity-50"
        >
          <option value="moderator">Moderator</option>
          <option value="staff">Staff</option>
          <option value="admin">Admin</option>
          <option value="super_admin">Super Admin</option>
        </select>
      </td>
      <td className="px-4 py-2">
        <button
          disabled={isPending || isSelf}
          onClick={() => startTransition(() => setAdminActive(user.id, !user.is_active))}
          className="rounded-md border border-line px-3 py-1 text-xs disabled:opacity-50"
        >
          {user.is_active ? "Deactivate" : "Activate"}
        </button>
      </td>
    </tr>
  );
}
