import Link from "next/link";
import { getAdminSession } from "@/lib/auth/get-admin";
import { adminApiFetchServer } from "@/lib/api-client";

interface ContentListItem {
  id: string;
  title: string;
  content_type: string;
  status: string;
  updated_at: string;
}

export default async function AdminContentListPage() {
  const session = await getAdminSession();
  const items = session
    ? await adminApiFetchServer<ContentListItem[]>("/admin/content", session.accessToken)
    : [];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Content</h1>
        <Link
          href="/admin/content/new"
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover"
        >
          New content
        </Link>
      </div>

      <div className="overflow-hidden rounded-lg border border-line bg-surface">
        <table className="w-full text-sm">
          <thead className="border-b border-line bg-surface-2 text-left text-ink-faint">
            <tr>
              <th className="px-4 py-2 font-medium">Title</th>
              <th className="px-4 py-2 font-medium">Type</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2 font-medium">Updated</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b border-line-faint last:border-0">
                <td className="px-4 py-2">
                  <Link href={`/admin/content/${item.id}`} className="text-accent-ink hover:underline">
                    {item.title}
                  </Link>
                </td>
                <td className="px-4 py-2 capitalize">{item.content_type.replace("_", " ")}</td>
                <td className="px-4 py-2 capitalize">{item.status}</td>
                <td className="px-4 py-2 text-ink-faint">
                  {new Date(item.updated_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-ink-faint">
                  No content yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
