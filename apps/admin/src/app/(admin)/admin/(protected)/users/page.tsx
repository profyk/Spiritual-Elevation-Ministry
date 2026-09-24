import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth/get-admin";
import { adminApiFetchServer } from "@/lib/api-client";
import { canManageAdminUsers, type AdminRole } from "@sem/shared";
import { AdminUserRow } from "@/components/admin/AdminUserRow";
import { NewAdminUserForm } from "@/components/admin/NewAdminUserForm";

interface AdminUserListItem {
  id: string;
  full_name: string;
  role: AdminRole;
  is_active: boolean;
}

export default async function AdminUsersPage() {
  const session = await getAdminSession();
  if (!canManageAdminUsers(session?.admin ?? null)) redirect("/admin");

  const users = await adminApiFetchServer<AdminUserListItem[]>("/admin/users", session!.accessToken);

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold">Users &amp; Roles</h1>
      <NewAdminUserForm />
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
            {users.map((user) => (
              <AdminUserRow key={user.id} user={user} isSelf={user.id === session!.admin.id} />
            ))}
            {users.length === 0 && (
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
