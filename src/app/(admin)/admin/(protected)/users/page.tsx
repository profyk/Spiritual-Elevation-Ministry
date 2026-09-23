import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAdminSession } from "@/lib/auth/get-admin";
import { canManageAdminUsers } from "@/lib/permissions";
import { AdminUserRow } from "@/components/admin/AdminUserRow";

export default async function AdminUsersPage() {
  const session = await getAdminSession();
  if (!canManageAdminUsers(session?.admin ?? null)) redirect("/admin");

  const supabase = await createClient();
  const { data: users } = await supabase
    .from("admin_users")
    .select("id, full_name, role, is_active")
    .order("full_name");

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold">Users &amp; Roles</h1>
      <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-neutral-200 bg-neutral-50 text-left text-neutral-500">
            <tr>
              <th className="px-4 py-2 font-medium">Name</th>
              <th className="px-4 py-2 font-medium">Role</th>
              <th className="px-4 py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {(users ?? []).map((user) => (
              <AdminUserRow key={user.id} user={user} isSelf={user.id === session!.admin.id} />
            ))}
            {(!users || users.length === 0) && (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-neutral-500">
                  No admin users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
