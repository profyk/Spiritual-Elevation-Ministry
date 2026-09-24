import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth/get-admin";
import { adminApiFetchServer } from "@/lib/api-client";
import { isAdminOrAbove } from "@sem/shared";

interface AuditLogEntry {
  id: string;
  actor_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  created_at: string;
}

export default async function AdminAuditLogPage() {
  const session = await getAdminSession();
  if (!isAdminOrAbove(session?.admin ?? null)) redirect("/admin");

  const entries = await adminApiFetchServer<AuditLogEntry[]>("/admin/audit-log", session!.accessToken);

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold">Audit Log</h1>
      <p className="mb-4 text-xs text-ink-faint">
        Append-only — nothing here can be edited or deleted, including by Super Admin.
      </p>
      <div className="overflow-hidden rounded-lg border border-line bg-surface">
        <table className="w-full text-sm">
          <thead className="border-b border-line bg-surface-2 text-left text-ink-faint">
            <tr>
              <th className="px-4 py-2 font-medium">When</th>
              <th className="px-4 py-2 font-medium">Action</th>
              <th className="px-4 py-2 font-medium">Entity</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.id} className="border-b border-line-faint last:border-0">
                <td className="px-4 py-2 text-ink-faint">
                  {new Date(entry.created_at).toLocaleString()}
                </td>
                <td className="px-4 py-2 font-mono text-xs">{entry.action}</td>
                <td className="px-4 py-2 text-ink-faint">
                  {entry.entity_type}
                  {entry.entity_id ? ` · ${entry.entity_id.slice(0, 8)}` : ""}
                </td>
              </tr>
            ))}
            {entries.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-ink-faint">
                  No activity yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
