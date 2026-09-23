import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function AdminContentListPage() {
  const supabase = await createClient();
  const { data: items } = await supabase
    .from("content_items")
    .select("id, title, content_type, status, updated_at")
    .order("updated_at", { ascending: false });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Content</h1>
        <Link
          href="/admin/content/new"
          className="rounded-md bg-amber-800 px-4 py-2 text-sm font-medium text-white hover:bg-amber-900"
        >
          New content
        </Link>
      </div>

      <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-neutral-200 bg-neutral-50 text-left text-neutral-500">
            <tr>
              <th className="px-4 py-2 font-medium">Title</th>
              <th className="px-4 py-2 font-medium">Type</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2 font-medium">Updated</th>
            </tr>
          </thead>
          <tbody>
            {(items ?? []).map((item) => (
              <tr key={item.id} className="border-b border-neutral-100 last:border-0">
                <td className="px-4 py-2">
                  <Link href={`/admin/content/${item.id}`} className="text-amber-900 hover:underline">
                    {item.title}
                  </Link>
                </td>
                <td className="px-4 py-2 capitalize">{item.content_type.replace("_", " ")}</td>
                <td className="px-4 py-2 capitalize">{item.status}</td>
                <td className="px-4 py-2 text-neutral-500">
                  {new Date(item.updated_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
            {(!items || items.length === 0) && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-neutral-500">
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
